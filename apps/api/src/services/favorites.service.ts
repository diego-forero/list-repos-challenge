import type { db as dbType } from "../db/client";
import { favoritesRepo } from "../repositories/favorites.repo";

export function favoritesService(db: typeof dbType) {
  const favorites = favoritesRepo(db);

  return {
    async list(userId: string) {
      return favorites.listByUserId(userId);
    },

    async add(userId: string, repoId: string, repoName?: string) {
      try {
        return await favorites.insert(userId, repoId, repoName);
      } catch {
        // idempotent: return existing
        return (await favorites.findByUserAndRepo(userId, repoId)) ?? null;
      }
    },

    async remove(userId: string, repoId: string) {
      await favorites.deleteByUserAndRepo(userId, repoId);
    },
  };
}
