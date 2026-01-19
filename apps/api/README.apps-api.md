# HelloBuild – Backend API (apps/api)

This folder contains the **backend API** for the HelloBuild “ReactJS Exercise” challenge.

The API provides:
- **Auth** (sign up / login / logout / me) using a **session cookie** (`sid`)
- **GitHub OAuth** connection (stores the access token in DB)
- **GitHub repositories** listing via **GitHub GraphQL v4**
- **Favorites** persistence in DB (favorites are stored **in our app**, not on GitHub)

---

## Tech stack

- Node.js (TypeScript, ESM)
- Express
- PostgreSQL
- Drizzle ORM + drizzle-kit (migrations)
- Argon2 (password hashing)
- Vitest + Supertest (tests)

---

## Local development

### Prerequisites
- Docker + Docker Compose
- Node.js 20+
- pnpm

> This repository is a **pnpm workspace** (monorepo). Dependencies are installed at the repo root.

### Environment variables

Backend reads env vars from the repo root `.env` (because docker-compose mounts the repo):

```bash
# Backend
PORT=3001
DATABASE_URL=postgresql://app:app@db:5432/hellobuild
APP_URL=http://localhost:8080

# OAuth GitHub
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GITHUB_CALLBACK_URL=http://localhost:3001/github/oauth/callback
```

Notes:
- When running the API **inside Docker**, `DATABASE_URL` should use host `db` (the docker-compose service name).
- When running the API **directly on your machine**, use `localhost` instead of `db`:
  `postgresql://app:app@localhost:5432/hellobuild`

---

## Running with Docker Compose (recommended)

From the **repo root**:

```bash
# Start database
docker compose up -d db

# Start API (foreground; good for logs)
docker compose up api
```

Useful commands:

```bash
# Check status
docker compose ps

# Stop everything
docker compose down
```

### Quick DB check (psql inside container)

```bash
docker exec -it $(docker ps -qf "name=db") psql -U app -d hellobuild
```

---

## Database & migrations (Drizzle)

Schema lives in:

- `src/db/schema.ts`

Client lives in:

- `src/db/client.ts`

If you are using drizzle-kit migrations, keep:
- `drizzle.config.ts` (or equivalent)
- a `drizzle/` or `migrations/` folder (depending on your setup)

Typical commands (adjust to your scripts):

```bash
# Generate migration (example)
pnpm drizzle-kit generate

# Apply migrations (example)
pnpm drizzle-kit migrate
```

> If you haven’t created drizzle-kit scripts yet, add them to `apps/api/package.json` as you prefer.

---

## API overview

Base URL (local): `http://localhost:3001`

### Health
`GET /health`

Response `200`:
```json
{ "ok": true }
```

---

## Auth (cookie sessions)

The API uses a **session cookie**:
- Cookie name: `sid`
- HttpOnly: true
- SameSite: Lax

Frontend requests must include cookies:
- `fetch(..., { credentials: "include" })`

### Sign up
`POST /auth/signup`

Body:
```json
{ "email": "test@example.com", "password": "12345678" }
```

Responses:
- `201`:
```json
{ "user": { "id": "uuid", "email": "test@example.com" } }
```
- `409`:
```json
{ "error": "Email already in use" }
```

### Login
`POST /auth/login`

Body:
```json
{ "email": "test@example.com", "password": "12345678" }
```

Response `200` (sets `sid` cookie):
```json
{ "user": { "id": "uuid", "email": "test@example.com" } }
```

### Current user
`GET /auth/me`

- `200`:
```json
{ "user": { "id": "uuid", "email": "test@example.com" } }
```
- `401`:
```json
{ "error": "Not authenticated" }
```

### Logout
`POST /auth/logout`

- `204` (no body)

---

## GitHub OAuth + Repositories

This app **does not** require the GitHub account email to match the app user email.
The user logs into the app with email/password, then **connects a GitHub account** via OAuth.

### Start OAuth
`GET /github/oauth/start` (requires app session)

This redirects (302) to GitHub’s authorization page.  
After the user approves, GitHub redirects to the backend callback, and the backend redirects to:

- `http://localhost:8080/profile` (frontend profile page)

### Check connection
`GET /github/me` (requires app session)

If not connected:
```json
{ "connected": false }
```

If connected:
```json
{
  "connected": true,
  "githubLogin": "diego-forero",
  "githubUserId": "MDQ6VXNlcjQzNjgwMTgz"
}
```

### List repositories (GraphQL v4)
`GET /github/repos` (requires app session + GitHub connected)

Response:
```json
{
  "repos": [
    {
      "id": "R_kgDOPAzAgQ",
      "name": "testing-magic",
      "nameWithOwner": "diego-forero/testing-magic",
      "url": "https://github.com/diego-forero/testing-magic",
      "isPrivate": false,
      "updatedAt": "2025-06-24T04:36:30Z",
      "description": null,
      "stargazerCount": 0,
      "forkCount": 0,
      "primaryLanguage": { "name": "TypeScript" }
    }
  ],
  "pageInfo": { "hasNextPage": false, "endCursor": "..." }
}
```

If GitHub is not connected:
- `409`:
```json
{ "error": "GitHub not connected" }
```

---

## Favorites (persisted in DB)

Favorites are stored **in this application’s database**, not on GitHub.

### List favorites
`GET /favorites` (requires app session)

```json
{
  "favorites": [
    {
      "id": "uuid",
      "userId": "uuid",
      "repoId": "R_kgDOPAzAgQ",
      "repoName": "diego-forero/testing-magic",
      "createdAt": "..."
    }
  ]
}
```

### Add favorite
`POST /favorites` (requires app session)

Body:
```json
{ "repoId": "R_kgDOPAzAgQ", "repoName": "diego-forero/testing-magic" }
```

Notes:
- `repoId` is **required**
- `repoName` is **optional** (but recommended for easier display)

Responses:
- `201` created
- `200` if already exists (idempotent behavior)

### Remove favorite
`DELETE /favorites/:repoId` (requires app session)

- `204` (no body)

---

## Testing

This API includes **end-to-end tests** (Vitest + Supertest) that hit the running Express server and use Postgres.

### Recommended workflow (while the stack is running)

1) Start the stack from the repo root:

```bash
docker compose up --build
```

2) In another terminal, run:

```bash
docker compose run --rm api pnpm --filter api test
```

This runs tests in a temporary one-off container, without stopping the running API.


### Standalone tests (without running the full stack)

```bash
docker compose up -d db
docker compose run --rm api pnpm --filter api db:migrate
docker compose run --rm api pnpm --filter api test
```


---

## Project structure

```
apps/api/src/
  auth/
  db/
  middleware/
  routes/
  server.ts
```

---

## Suggested README layout for the monorepo

Yes—having **multiple READMEs** is a good idea:

- **Root README.md**: how to run the whole system (db + api + web), architecture summary, overall setup.
- **apps/api/README.md**: backend-specific docs (this file).
- **apps/web/README.md**: frontend-specific docs (routes, UI, env vars, how to run).

This keeps documentation focused and easy to find.

---
