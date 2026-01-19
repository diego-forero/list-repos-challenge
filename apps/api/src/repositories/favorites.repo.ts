import { and, eq } from "drizzle-orm";
import type { db as dbType } from "../db/client";
import { favorites } from "../db/schema";

export function favoritesRepo(db: typeof dbType) {
  return {
    async listByUserId(userId: string) {
      return db.select().from(favorites).where(eq(favorites.userId, userId));
    },

    async findByUserAndRepo(userId: string, repoId: string) {
      const rows = await db
        .select()
        .from(favorites)
        .where(and(eq(favorites.userId, userId), eq(favorites.repoId, repoId)))
        .limit(1);
      return rows[0] ?? null;
    },

    async insert(userId: string, repoId: string, repoName?: string) {
      const rows = await db
        .insert(favorites)
        .values({ userId, repoId, repoName })
        .returning();
      return rows[0];
    },

    async deleteByUserAndRepo(userId: string, repoId: string) {
      await db
        .delete(favorites)
        .where(and(eq(favorites.userId, userId), eq(favorites.repoId, repoId)));
    },
  };
}
