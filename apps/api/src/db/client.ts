import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { env } from "../config/env";

export const sql = postgres(env.DATABASE_URL, { max: 10 });
export const db = drizzle(sql);

export async function closeDb() {
  await sql.end({ timeout: 5 });
}
