import { Router } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";

import { db } from "../db/client";
import { githubAccounts } from "../db/schema";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

const CLIENT_ID = process.env.GITHUB_CLIENT_ID!;
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET!;
const CALLBACK_URL = process.env.GITHUB_CALLBACK_URL!;

function assertEnv() {
  if (!CLIENT_ID || !CLIENT_SECRET || !CALLBACK_URL) {
    throw new Error("Missing GitHub OAuth env vars (GITHUB_CLIENT_ID/SECRET/CALLBACK_URL)");
  }
}

router.get("/oauth/start", requireAuth, async (_req, res) => {
  assertEnv();

  // Minimal scopes: read:user. Add "repo" only if you want private repos too.
  const scope = "read:user";

  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", CLIENT_ID);
  url.searchParams.set("redirect_uri", CALLBACK_URL);
  url.searchParams.set("scope", scope);

  // Optional: state (recommended). For the challenge, we can keep it simple.
  res.redirect(url.toString());
});

router.get("/oauth/callback", requireAuth, async (req, res) => {
  assertEnv();

  const codeSchema = z.object({ code: z.string().min(1) });
  const parsed = codeSchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).send("Missing code");

  const { code } = parsed.data;

  // Exchange code for access token
  const tokenResp = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code,
      redirect_uri: CALLBACK_URL,
    }),
  });

  if (!tokenResp.ok) {
    const txt = await tokenResp.text();
    return res.status(500).send(`Token exchange failed: ${txt}`);
  }

  const tokenJson: any = await tokenResp.json();
  const accessToken = tokenJson.access_token as string | undefined;
  if (!accessToken) return res.status(500).send("No access_token returned from GitHub");

  // Fetch viewer identity from GitHub GraphQL v4
  const gqlResp = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: `query { viewer { id login } }`,
    }),
  });

  if (!gqlResp.ok) {
    const txt = await gqlResp.text();
    return res.status(500).send(`GitHub GraphQL failed: ${txt}`);
  }

  const gqlJson: any = await gqlResp.json();
  const viewer = gqlJson?.data?.viewer;
  const githubUserId = viewer?.id as string | undefined;
  const githubLogin = viewer?.login as string | undefined;

  const userId = (req as any).user.id as string;

  // Upsert-like behavior: one GitHub account per app user
  const existing = await db.select().from(githubAccounts).where(eq(githubAccounts.userId, userId)).limit(1);

  if (existing.length) {
    await db
      .update(githubAccounts)
      .set({ accessToken, githubUserId, githubLogin })
      .where(eq(githubAccounts.userId, userId));
  } else {
    await db.insert(githubAccounts).values({ userId, accessToken, githubUserId, githubLogin });
  }

  // Redirect back to frontend profile
  const appUrl = process.env.APP_URL ?? "http://localhost:5173";
  res.redirect(`${appUrl}/profile`);
});

router.get("/me", requireAuth, async (req, res) => {
  const userId = (req as any).user.id as string;

  const rows = await db.select().from(githubAccounts).where(eq(githubAccounts.userId, userId)).limit(1);
  if (!rows.length) return res.status(200).json({ connected: false });

  return res.status(200).json({
    connected: true,
    githubLogin: rows[0].githubLogin,
    githubUserId: rows[0].githubUserId,
  });
});

router.get("/repos", requireAuth, async (req, res) => {
  const userId = (req as any).user.id as string;

  const rows = await db.select().from(githubAccounts).where(eq(githubAccounts.userId, userId)).limit(1);
  if (!rows.length) return res.status(409).json({ error: "GitHub not connected" });

  const accessToken = rows[0].accessToken;

  // NOTE: This fetches first 50 repos. We'll add pagination later if needed.
  const query = `
    query ($first: Int!, $after: String) {
      viewer {
        repositories(first: $first, after: $after, ownerAffiliations: OWNER, orderBy: {field: UPDATED_AT, direction: DESC}) {
          pageInfo { hasNextPage endCursor }
          nodes {
            id
            name
            nameWithOwner
            url
            isPrivate
            updatedAt
            description
            stargazerCount
            forkCount
            primaryLanguage { name }
          }
        }
      }
    }
  `;

  const gqlResp = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      variables: { first: 50, after: null },
    }),
  });

  if (!gqlResp.ok) {
    const txt = await gqlResp.text();
    return res.status(502).json({ error: "GitHub GraphQL error", details: txt });
  }

  const gqlJson: any = await gqlResp.json();
  if (gqlJson.errors?.length) {
    return res.status(502).json({ error: "GitHub GraphQL error", details: gqlJson.errors });
  }

  const repos = gqlJson?.data?.viewer?.repositories?.nodes ?? [];
  const pageInfo = gqlJson?.data?.viewer?.repositories?.pageInfo ?? null;

  return res.json({ repos, pageInfo });
});



export default router;
