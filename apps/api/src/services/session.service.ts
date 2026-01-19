import type { db as dbType } from "../db/client";
import { HttpError } from "../errors/httpError";
import { usersRepo } from "../repositories/users.repo";
import { sessionsRepo } from "../repositories/sessions.repo";

export type SessionUser = { id: string; email: string };

export function sessionService(db: typeof dbType) {
  const users = usersRepo(db);
  const sessions = sessionsRepo(db);

  return {
    async getUserFromSid(sid: string): Promise<SessionUser> {
      const session = await sessions.findById(sid);
      if (!session) throw new HttpError(401, "Not authenticated");

      const expiresAt = session.expiresAt instanceof Date ? session.expiresAt : new Date(session.expiresAt);
      if (expiresAt.getTime() < Date.now()) {
        await sessions.deleteById(sid);
        throw new HttpError(401, "Session expired");
      }

      const user = await users.findById(session.userId);
      if (!user) throw new HttpError(401, "Not authenticated");

      return { id: user.id, email: user.email };
    },
  };
}
