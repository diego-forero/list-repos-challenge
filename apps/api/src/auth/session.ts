import { randomUUID } from "crypto";

export const SESSION_COOKIE_NAME = "sid";

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
  };
}

export function newSessionId(): string {
  return randomUUID();
}
