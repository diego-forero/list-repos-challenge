import { eq } from "drizzle-orm";
import type { db as dbType } from "../db/client";
import { sessions } from "../db/schema";

export function sessionsRepo(db: typeof dbType) {
  return {
    async findById(id: string) {
      const rows = await db.select().from(sessions).where(eq(sessions.id, id)).limit(1);
      return rows[0] ?? null;
    },

    async insert(params: { id: string; userId: string; expiresAt: Date }) {
      await db.insert(sessions).values({
        id: params.id,
        userId: params.userId,
        expiresAt: params.expiresAt,
      });
    },

    async deleteById(id: string) {
      await db.delete(sessions).where(eq(sessions.id, id));
    },
  };
}
