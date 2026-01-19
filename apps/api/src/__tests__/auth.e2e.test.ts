import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../app";
import { resetDb } from "./testDb";

describe("Auth E2E", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("signup -> login -> me works with cookie session", async () => {
    const app = createApp();
    const agent = request.agent(app);

    const email = "test@example.com";
    const password = "12345678";

    const signup = await agent.post("/auth/signup").send({ email, password });
    expect(signup.status).toBe(201);

    const login = await agent.post("/auth/login").send({ email, password });
    expect(login.status).toBe(200);
    expect(login.body.user.email).toBe(email);

    const me = await agent.get("/auth/me");
    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe(email);
  });
});
