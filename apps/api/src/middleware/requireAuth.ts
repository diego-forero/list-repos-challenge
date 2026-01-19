import type { Request, Response, NextFunction } from "express";
import { db } from "../db/client";
import { sessionService } from "../services/session.service";
import { SESSION_COOKIE_NAME } from "../auth/session";

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const sid = req.cookies?.[SESSION_COOKIE_NAME];
    if (!sid) return res.status(401).json({ error: "Not authenticated" });

    const user = await sessionService(db).getUserFromSid(sid);
    (req as any).user = user;
    return next();
  } catch {
    return res.status(401).json({ error: "Not authenticated" });
  }
}
