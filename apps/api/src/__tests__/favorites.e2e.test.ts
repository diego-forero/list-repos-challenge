import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../app";
import { resetDb } from "./testDb";

async function signupAndLogin(agent: request.SuperAgentTest, email: string) {
  const password = "12345678";
  await agent.post("/auth/signup").send({ email, password });
  await agent.post("/auth/login").send({ email, password });
}

describe("Favorites E2E", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("requires auth", async () => {
    const app = createApp();
    const res = await request(app).get("/favorites");
    expect(res.status).toBe(401);
  });

  it("can add/list/delete favorites", async () => {
    const app = createApp();
    const agent = request.agent(app);

    await signupAndLogin(agent, "fav@example.com");

    const add = await agent.post("/favorites").send({ repoId: "R_123", repoName: "hello/repo" });
    expect([200, 201]).toContain(add.status);

    const list = await agent.get("/favorites");
    expect(list.status).toBe(200);
    expect(list.body.favorites.length).toBe(1);

    const del = await agent.delete("/favorites/R_123");
    expect(del.status).toBe(204);

    const list2 = await agent.get("/favorites");
    expect(list2.status).toBe(200);
    expect(list2.body.favorites.length).toBe(0);
  });
});
