import type { db as dbType } from "../db/client";
import { HttpError } from "../errors/httpError";
import { requireGithubEnv } from "../config/env";
import { githubAccountsRepo } from "../repositories/githubAccounts.repo";
import { exchangeCodeForToken, fetchViewer, fetchRepos } from "../github/githubClient";

export function githubService(db: typeof dbType) {
  const githubAccounts = githubAccountsRepo(db);

  return {
    getAuthorizeUrl() {
      const { clientId, callbackUrl } = requireGithubEnv();

      const scope = "read:user";
      const url = new URL("https://github.com/login/oauth/authorize");
      url.searchParams.set("client_id", clientId);
      url.searchParams.set("redirect_uri", callbackUrl);
      url.searchParams.set("scope", scope);

      return url.toString();
    },

    async handleOAuthCallback(params: { userId: string; code: string }) {
      const { clientId, clientSecret, callbackUrl } = requireGithubEnv();

      const accessToken = await exchangeCodeForToken({
        clientId,
        clientSecret,
        code: params.code,
        redirectUri: callbackUrl,
      });

      const viewer = await fetchViewer(accessToken);

      await githubAccounts.upsertByUserId({
        userId: params.userId,
        accessToken,
        githubUserId: viewer.id,
        githubLogin: viewer.login,
      });
    },

    async me(userId: string) {
      const row = await githubAccounts.findByUserId(userId);
      if (!row) return { connected: false as const };
      return {
        connected: true as const,
        githubLogin: row.githubLogin,
        githubUserId: row.githubUserId,
      };
    },

    async repos(userId: string) {
      const row = await githubAccounts.findByUserId(userId);
      if (!row) throw new HttpError(409, "GitHub not connected");

      const { repos, pageInfo } = await fetchRepos(row.accessToken, 50, null);
      return { repos, pageInfo };
    },
  };
}
