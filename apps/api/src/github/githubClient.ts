export type GithubViewer = { id: string; login: string };

export async function exchangeCodeForToken(params: {
  clientId: string;
  clientSecret: string;
  code: string;
  redirectUri: string;
}): Promise<string> {
  const tokenResp = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: params.clientId,
      client_secret: params.clientSecret,
      code: params.code,
      redirect_uri: params.redirectUri,
    }),
  });

  if (!tokenResp.ok) {
    const txt = await tokenResp.text();
    throw new Error(`Token exchange failed: ${txt}`);
  }

  const json: any = await tokenResp.json();
  const accessToken = json.access_token as string | undefined;
  if (!accessToken) throw new Error("No access_token returned from GitHub");

  return accessToken;
}

export async function fetchViewer(accessToken: string): Promise<GithubViewer> {
  const resp = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: `query { viewer { id login } }`,
    }),
  });

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`GitHub GraphQL failed: ${txt}`);
  }

  const json: any = await resp.json();
  const viewer = json?.data?.viewer;
  if (!viewer?.id || !viewer?.login) throw new Error("Invalid viewer response from GitHub");
  return { id: viewer.id, login: viewer.login };
}

export async function fetchRepos(accessToken: string, first = 50, after: string | null = null) {
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

  const resp = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      variables: { first, after },
    }),
  });

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`GitHub GraphQL error: ${txt}`);
  }

  const json: any = await resp.json();
  if (json.errors?.length) {
    throw new Error(`GitHub GraphQL errors: ${JSON.stringify(json.errors)}`);
  }

  const repos = json?.data?.viewer?.repositories?.nodes ?? [];
  const pageInfo = json?.data?.viewer?.repositories?.pageInfo ?? null;
  return { repos, pageInfo };
}
