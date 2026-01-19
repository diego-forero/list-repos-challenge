import { Router } from "express";
import { z } from "zod";
import argon2 from "argon2";
import { eq } from "drizzle-orm";

import { db } from "../db/client";
import { users, sessions } from "../db/schema";
import { SESSION_COOKIE_NAME, sessionCookieOptions, newSessionId } from "../auth/session";

const router = Router();

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

router.post("/signup", async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid payload" });

  const { email, password } = parsed.data;

  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing.length) return res.status(409).json({ error: "Email already in use" });

  const passwordHash = await argon2.hash(password);

  const inserted = await db
    .insert(users)
    .values({ email, passwordHash })
    .returning({ id: users.id, email: users.email });

  return res.status(201).json({ user: inserted[0] });
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid payload" });

  const { email, password } = parsed.data;

  const found = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!found.length) return res.status(401).json({ error: "Invalid credentials" });

  const user = found[0];
  const ok = await argon2.verify(user.passwordHash, password);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const sid = newSessionId();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await db.insert(sessions).values({
    id: sid,
    userId: user.id,
    expiresAt,
  });

  res.cookie(SESSION_COOKIE_NAME, sid, sessionCookieOptions());
  return res.json({ user: { id: user.id, email: user.email } });
});

router.post("/logout", async (req, res) => {
  const sid = req.cookies?.[SESSION_COOKIE_NAME];
  console.log("TEST LOGOUT")
  if (sid) {
    await db.delete(sessions).where(eq(sessions.id, sid));
  }
  res.clearCookie(SESSION_COOKIE_NAME, sessionCookieOptions());
  return res.status(204).send();
});

router.get("/me", async (req, res) => {
  const sid = req.cookies?.[SESSION_COOKIE_NAME];
  if (!sid) return res.status(401).json({ error: "Not authenticated" });

  const sessionRows = await db.select().from(sessions).where(eq(sessions.id, sid)).limit(1);
  if (!sessionRows.length) return res.status(401).json({ error: "Not authenticated" });

  const session = sessionRows[0];
  if (new Date(session.expiresAt).getTime() < Date.now()) {
    await db.delete(sessions).where(eq(sessions.id, sid));
    return res.status(401).json({ error: "Session expired" });
  }

  const userRows = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
  if (!userRows.length) return res.status(401).json({ error: "Not authenticated" });

  const user = userRows[0];
  return res.json({ user: { id: user.id, email: user.email } });
});

export default router;
