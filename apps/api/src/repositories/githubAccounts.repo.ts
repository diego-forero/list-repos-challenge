import { eq } from "drizzle-orm";
import type { db as dbType } from "../db/client";
import { githubAccounts } from "../db/schema";

export function githubAccountsRepo(db: typeof dbType) {
  return {
    async findByUserId(userId: string) {
      const rows = await db
        .select()
        .from(githubAccounts)
        .where(eq(githubAccounts.userId, userId))
        .limit(1);
      return rows[0] ?? null;
    },

    async upsertByUserId(params: {
      userId: string;
      accessToken: string;
      githubUserId?: string;
      githubLogin?: string;
    }) {
      const existing = await this.findByUserId(params.userId);

      if (existing) {
        await db
          .update(githubAccounts)
          .set({
            accessToken: params.accessToken,
            githubUserId: params.githubUserId ?? null,
            githubLogin: params.githubLogin ?? null,
          })
          .where(eq(githubAccounts.userId, params.userId));
        return;
      }

      await db.insert(githubAccounts).values({
        userId: params.userId,
        accessToken: params.accessToken,
        githubUserId: params.githubUserId ?? null,
        githubLogin: params.githubLogin ?? null,
      });
    },
  };
}
