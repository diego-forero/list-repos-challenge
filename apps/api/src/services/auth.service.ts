import argon2 from "argon2";
import type { db as dbType } from "../db/client";
import { HttpError } from "../errors/httpError";
import { usersRepo } from "../repositories/users.repo";
import { sessionsRepo } from "../repositories/sessions.repo";
import { newSessionId } from "../auth/session";
import { sessionService } from "./session.service";

export function authService(db: typeof dbType) {
  const users = usersRepo(db);
  const sessions = sessionsRepo(db);
  const sessionSvc = sessionService(db);

  return {
    async signup(email: string, password: string) {
      const existing = await users.findByEmail(email);
      if (existing) throw new HttpError(409, "Email already in use");

      const passwordHash = await argon2.hash(password);
      const inserted = await users.insert(email, passwordHash);
      return { id: inserted.id, email: inserted.email };
    },

    async login(email: string, password: string) {
      const user = await users.findByEmail(email);
      if (!user) throw new HttpError(401, "Invalid credentials");

      const ok = await argon2.verify(user.passwordHash, password);
      if (!ok) throw new HttpError(401, "Invalid credentials");

      const sid = newSessionId();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      await sessions.insert({ id: sid, userId: user.id, expiresAt });

      return { sid, user: { id: user.id, email: user.email } };
    },

    async logout(sid?: string) {
      if (sid) await sessions.deleteById(sid);
    },

    async me(sid: string) {
      const user = await sessionSvc.getUserFromSid(sid);
      return user;
    },
  };
}
