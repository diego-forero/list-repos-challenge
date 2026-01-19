import { Router } from "express";
import { z } from "zod";

import { db } from "../db/client";
import { authService } from "../services/auth.service";
import { asyncHandler } from "../utils/asyncHandler";
import { SESSION_COOKIE_NAME, sessionCookieOptions } from "../auth/session";

const router = Router();

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

router.post(
  "/signup",
  asyncHandler(async (req, res) => {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid payload" });

    const user = await authService(db).signup(parsed.data.email, parsed.data.password);
    return res.status(201).json({ user });
  })
);

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid payload" });

    const { sid, user } = await authService(db).login(parsed.data.email, parsed.data.password);

    res.cookie(SESSION_COOKIE_NAME, sid, sessionCookieOptions());
    return res.json({ user });
  })
);

router.post(
  "/logout",
  asyncHandler(async (req, res) => {
    const sid = req.cookies?.[SESSION_COOKIE_NAME] as string | undefined;
    await authService(db).logout(sid);
    res.clearCookie(SESSION_COOKIE_NAME, sessionCookieOptions());
    return res.status(204).send();
  })
);

router.get(
  "/me",
  asyncHandler(async (req, res) => {
    const sid = req.cookies?.[SESSION_COOKIE_NAME];
    if (!sid) return res.status(401).json({ error: "Not authenticated" });

    const user = await authService(db).me(sid);
    return res.json({ user });
  })
);

export default router;
