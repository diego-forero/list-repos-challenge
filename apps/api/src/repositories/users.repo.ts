import { eq } from "drizzle-orm";
import type { db as dbType } from "../db/client";
import { users } from "../db/schema";

export function usersRepo(db: typeof dbType) {
  return {
    async findByEmail(email: string) {
      const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
      return rows[0] ?? null;
    },

    async findById(id: string) {
      const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
      return rows[0] ?? null;
    },

    async insert(email: string, passwordHash: string) {
      const rows = await db
        .insert(users)
        .values({ email, passwordHash })
        .returning({ id: users.id, email: users.email });
      return rows[0];
    },
  };
}
