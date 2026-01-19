import { sql } from "../db/client";

export async function resetDb() {
  // Requires migrations already applied (tables exist).
  await sql.unsafe(`
    TRUNCATE TABLE
      favorites,
      github_accounts,
      sessions,
      users
    RESTART IDENTITY
    CASCADE;
  `);
}
