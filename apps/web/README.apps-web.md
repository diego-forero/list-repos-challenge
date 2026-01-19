# HelloBuild – Web App (apps/web)

This folder contains the **React SPA** for the HelloBuild challenge.

Features:
- **Sign Up / Login** (session-based auth via the backend API)
- **Profile page**
- **Connect GitHub** (OAuth via backend redirect)
- **List GitHub repositories** (via backend -> GitHub GraphQL)
- **Favorites** (add/remove and persist in the app DB)

---

## Tech stack

- React + TypeScript
- Vite
- Tailwind CSS (+ shadcn/ui components)

---

## Environment variables

The frontend reads env vars from the repo root `.env` when running via Docker Compose:

```bash
VITE_API_URL=http://localhost:3001
```

Notes:
- The frontend calls the API with cookies, so requests must include credentials.
- In dev, the API enables CORS with `credentials: true` and `origin=APP_URL`.

---

## Run with Docker Compose (recommended)

From the **repo root**:

```bash
docker compose up --build
```

Then open:
- Web: http://localhost:8080
- API: http://localhost:3001

---

## Run locally (without Docker)

From the **repo root**:

```bash
corepack enable
pnpm -w install
pnpm --filter web dev
```

Vite will typically serve at:
- http://localhost:5173

Make sure your `.env` points to the API you’re running:

```bash
VITE_API_URL=http://localhost:3001
```

---

## Useful scripts

From the repo root:

```bash
# Dev server
pnpm --filter web dev

# Build
pnpm --filter web build

# Preview production build (after build)
pnpm --filter web preview

# Lint
pnpm --filter web lint
```

---
