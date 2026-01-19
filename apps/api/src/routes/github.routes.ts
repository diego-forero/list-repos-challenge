import { Router } from "express";
import { z } from "zod";

import { db } from "../db/client";
import { requireAuth } from "../middleware/requireAuth";
import { asyncHandler } from "../utils/asyncHandler";
import { githubService } from "../services/github.service";
import { env } from "../config/env";

const router = Router();

router.get(
  "/oauth/start",
  requireAuth,
  asyncHandler(async (_req, res) => {
    const url = githubService(db).getAuthorizeUrl();
    return res.redirect(url);
  })
);

router.get(
  "/oauth/callback",
  requireAuth,
  asyncHandler(async (req, res) => {
    const codeSchema = z.object({ code: z.string().min(1) });
    const parsed = codeSchema.safeParse(req.query);
    if (!parsed.success) return res.status(400).send("Missing code");

    const userId = (req as any).user.id as string;
    await githubService(db).handleOAuthCallback({ userId, code: parsed.data.code });

    return res.redirect(`${env.APP_URL}/profile`);
  })
);

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = (req as any).user.id as string;
    const result = await githubService(db).me(userId);
    return res.status(200).json(result);
  })
);

router.get(
  "/repos",
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = (req as any).user.id as string;
    const result = await githubService(db).repos(userId);
    return res.json(result);
  })
);

export default router;
