# List Repos Challenge (HelloBuild) — Full-Stack Monorepo

This project implements the **HelloBuild ReactJS Exercise** as a small full-stack app.

## What the app does

A user can:

- **Sign up** and **log in**
- **Connect a GitHub account via OAuth**
- **List their GitHub repositories** (via GitHub GraphQL v4)
- **Search repositories** and maintain a **favorites list**
  - Favorites are persisted in the app database (not on GitHub)

> The exercise mentions LocalStorage for auth as a baseline; this implementation includes a backend API for auth (bonus points) and stores users/sessions in Postgres.

---

## User stories covered

- ✅ As a user I want to be able to **Sign Up** to the web app  
- ✅ As a user I want to be able to **Login** after signing up  
- ✅ As a user I want to **list all repositories** under my GitHub user (OAuth required)  
- ✅ As a user I want to **search through repositories** and create a list of **favorite repos**  

---

## Tech stack

**Frontend**
- React + TypeScript
- Vite
- Tailwind + shadcn/ui components

**Backend**
- Node.js + TypeScript (ESM)
- Express
- PostgreSQL
- Drizzle ORM + drizzle-kit migrations
- Session cookies (`sid`) for auth

**Dev UX**
- pnpm workspace monorepo
- Docker Compose (run everything with minimal setup)

---

## Repository structure

```text
.
├── apps/
│   ├── api/            # Express API (auth, favorites, github oauth)
│   └── web/            # React SPA (Vite)
├── docker-compose.yml
├── Dockerfile          # shared build image used by api + web services
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
└── package.json
```

---

## Requirements

### Recommended (easiest)
- Docker Desktop (Docker Compose v2)

### Optional (run without Docker)
- Node.js 20+
- pnpm 10+ (or Corepack enabled)
- PostgreSQL 16+

---

## Quick start (Docker — recommended)

### 1) Create `.env` (one time)

Create a file named `.env` in the repo root:

```bash
# Backend
PORT=3001
APP_URL=http://localhost:8080

# Docker Compose will set DATABASE_URL inside the container to use host "db".
DATABASE_URL=postgresql://app:app@db:5432/hellobuild

# GitHub OAuth (required only for GitHub connect + repo listing)
GITHUB_CLIENT_ID=YOUR_GITHUB_CLIENT_ID (Ask if needed)
GITHUB_CLIENT_SECRET=YOUR_GITHUB_CLIENT_SECRET (Ask if needed)
GITHUB_CALLBACK_URL=http://localhost:3001/github/oauth/callback

# Frontend
VITE_API_URL=http://localhost:3001
```

✅ Best practice: keep secrets out of git  
- commit an `.env.example` with placeholders  

---

### 2) Build & run the full stack

```bash
docker compose up --build
```

This starts:
- Postgres at `localhost:5432`
- API at `http://localhost:3001`
- Web at `http://localhost:8080`

✅ **Migrations are applied automatically on API startup** (the API container runs `db:migrate` before `dev`).

---

### 3) Open the app

- Web UI: http://localhost:8080  
- API health: http://localhost:3001/health  

---

## GitHub OAuth setup (for repo listing)

To enable “Connect GitHub”:

1. Go to GitHub → **Settings** → **Developer settings** → **OAuth Apps**
2. Create a new OAuth App:
   - **Homepage URL**: `http://localhost:8080`
   - **Authorization callback URL**: `http://localhost:3001/github/oauth/callback`
3. Copy **Client ID** and generate a **Client Secret**
4. Put them in `.env`:
   - `GITHUB_CLIENT_ID=...`
   - `GITHUB_CLIENT_SECRET=...`
   - `GITHUB_CALLBACK_URL=http://localhost:3001/github/oauth/callback`

If OAuth vars are not set, the app still runs (signup/login/favorites), but GitHub connection + repo listing won’t work.

---

## Database & migrations

### Migrations are auto-run when the API container starts

The `api` service runs:

- `pnpm --filter api db:migrate` then
- `pnpm --filter api dev`

### Manual migration commands (optional)

If you want to run migrations manually:

```bash
docker compose run --rm api pnpm --filter api db:migrate
```

If you generated new migrations:

```bash
docker compose run --rm api pnpm --filter api db:generate
docker compose run --rm api pnpm --filter api db:migrate
```

---

## Running tests

### Backend tests (Vitest + Supertest)

You can run backend tests **while the app is running** in another terminal (no need to stop containers):

```bash
docker compose run --rm api pnpm --filter api test
```

Notes:
- `docker compose run --rm api ...` starts a one-off container that shares the same network, so it can hit the existing `db` service.
- If the DB is empty, run migrations first (usually not needed because API startup applies them automatically):

```bash
docker compose run --rm api pnpm --filter api db:migrate
```

### Do I need to stop the app to run tests?

No. Running tests with `docker compose run --rm ...` is designed for “second terminal” usage.

---

## Common workflows

### Stop containers
- If you started in foreground: press `Ctrl + C`
- Then remove containers:

```bash
docker compose down
```

### Reset database (wipe data)
```bash
docker compose down -v
docker compose up --build
```

---

## Troubleshooting

### Signup fails with: `relation "users" does not exist`
Migrations were not applied. Run:

```bash
docker compose run --rm api pnpm --filter api db:migrate
```

### API/Web says `tsx: not found` or `vite: not found`
Dependencies were not installed into the image (or a stale build). Rebuild clean:

```bash
docker compose down -v --remove-orphans
docker compose build --no-cache
docker compose up
```

---

## Local run (without Docker) — optional

Docker is the intended “minimal setup” path, but you can run locally if you prefer.

```bash
corepack enable
pnpm -w install

# Run only db in docker
docker compose up -d db

# Use local DB URL
export DATABASE_URL="postgresql://app:app@localhost:5432/hellobuild"

pnpm --filter api db:migrate
pnpm --filter api dev
pnpm --filter web dev
```

---

## Additional docs

- `apps/api/README.md` — backend details (routes, auth, GitHub integration, favorites, tests)
- `apps/web/README.md` — frontend details (routes, UI, env vars)
