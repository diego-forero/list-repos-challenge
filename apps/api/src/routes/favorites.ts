import { Router } from "express";
import { z } from "zod";
import { and, eq } from "drizzle-orm";

import { db } from "../db/client";
import { favorites } from "../db/schema";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const userId = (req as any).user.id as string;

  const rows = await db.select().from(favorites).where(eq(favorites.userId, userId));
  return res.json({ favorites: rows });
});

const addSchema = z.object({
  repoId: z.string().min(1),
  repoName: z.string().min(1).optional(),
});

router.post("/", requireAuth, async (req, res) => {
  const userId = (req as any).user.id as string;
  const parsed = addSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid payload" });

  const { repoId, repoName } = parsed.data;

  // Insert (unique index prevents duplicates)
  try {
    const inserted = await db
      .insert(favorites)
      .values({ userId, repoId, repoName })
      .returning();
    return res.status(201).json({ favorite: inserted[0] });
  } catch {
    // If duplicate, return 200 OK idempotently
    const existing = await db
      .select()
      .from(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.repoId, repoId)))
      .limit(1);

    return res.status(200).json({ favorite: existing[0] ?? null });
  }
});

router.delete("/:repoId", requireAuth, async (req, res) => {
  const userId = (req as any).user.id as string;
  const repoId = req.params.repoId;

  await db.delete(favorites).where(and(eq(favorites.userId, userId), eq(favorites.repoId, repoId)));
  return res.status(204).send();
});

export default router;
