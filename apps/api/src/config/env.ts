import "dotenv/config";
import { z } from "zod";

const EnvSchema = z.object({
  PORT: z.coerce.number().default(3001),
  APP_URL: z.string().url().default("http://localhost:8080"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  // GitHub OAuth (optional unless you hit /github/*)
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GITHUB_CALLBACK_URL: z.string().url().optional(),
});

export const env = EnvSchema.parse(process.env);

export function requireGithubEnv() {
  const { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GITHUB_CALLBACK_URL } = env;
  if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET || !GITHUB_CALLBACK_URL) {
    throw new Error(
      "Missing GitHub OAuth env vars (GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET / GITHUB_CALLBACK_URL)"
    );
  }
  return {
    clientId: GITHUB_CLIENT_ID,
    clientSecret: GITHUB_CLIENT_SECRET,
    callbackUrl: GITHUB_CALLBACK_URL,
  };
}
