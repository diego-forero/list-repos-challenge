import type { Request, Response, NextFunction } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { sessions, users } from "../db/schema";
import { SESSION_COOKIE_NAME } from "../auth/session";

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
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

  (req as any).user = { id: userRows[0].id, email: userRows[0].email };
  next();
}
