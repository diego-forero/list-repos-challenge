import { Router } from "express";
import { z } from "zod";

import { db } from "../db/client";
import { requireAuth } from "../middleware/requireAuth";
import { asyncHandler } from "../utils/asyncHandler";
import { favoritesService } from "../services/favorites.service";

const router = Router();

router.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = (req as any).user.id as string;
    const rows = await favoritesService(db).list(userId);
    return res.json({ favorites: rows });
  })
);

const addSchema = z.object({
  repoId: z.string().min(1),
  repoName: z.string().min(1).optional(),
});

router.post(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = (req as any).user.id as string;
    const parsed = addSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid payload" });

    const fav = await favoritesService(db).add(userId, parsed.data.repoId, parsed.data.repoName);

    return res.status(fav ? 201 : 200).json({ favorite: fav });
  })
);

router.delete(
  "/:repoId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = (req as any).user.id as string;
    await favoritesService(db).remove(userId, req.params.repoId);
    return res.status(204).send();
  })
);

export default router;
