# HOME / The Break Co. Monorepo

This repository hosts the future HOME CRM platform in a single pnpm workspace.

> **Stack overview**
>
> - **Web app** – React, Vite, Tailwind, Framer Motion (apps/web)  
> - **API** – Express, TypeScript, Zod, Prisma (apps/api – Prisma landing soon)  
> - **Shared** – Cross-cutting types and schemas (packages/shared)

## Getting started

```bash
corepack enable              # once per machine
pnpm install                 # installs workspace dependencies
pnpm --filter @home/shared build
pnpm db:migrate              # prisma migrate dev --name init
pnpm dev                     # runs web (5173) + api (5000) in parallel
```

The `dev` script watches both apps. You can target a specific package with:

```bash
pnpm --filter web dev
pnpm --filter api dev
```

**macOS file descriptor limit**  
If you see `ENFILE: file table overflow` while running dev servers, start them with a higher limit:

```bash
pnpm dev:local
```

This bumps `ulimit -n` before launching both web and API.

## Environment configuration

Copy each example env file and fill real secrets:

- `apps/web/.env.example → .env.local`
- `apps/api/.env.example → .env`

The API expects a PostgreSQL database (see `docker-compose.yml`) and issues JWT cookies after Google OAuth. The web app consumes `VITE_API_URL` and Google client IDs.

## Docker & local services

`docker-compose.yml` spins up Postgres + MinIO for S3-compatible storage. After populating env files, you can run:

```bash
docker compose up --build
```

The compose file builds both apps using the workspace context.

## Repository structure

```
apps/
  api/      # Express + TypeScript backend
  web/      # React frontend (migrated legacy Vite app)
packages/
  shared/   # Shared zod schemas, primitive types, utilities
```

Upcoming phases will introduce Prisma models, more API routes, portal-specific UIs, CI workflows, and deployment manifests.

## Error Monitoring

**Error Monitoring Enabled** ✅

The platform uses [Sentry](https://sentry.io) for production-grade error monitoring. All errors are automatically captured, grouped, and traceable.

- **Frontend errors** - Uncaught exceptions, React errors, promise rejections
- **Backend errors** - API errors, unhandled exceptions, promise rejections
- **User context** - Errors tagged with user role, route, and feature
- **Release tracking** - Compare error rates before/after deployments

See [SENTRY_SETUP.md](./SENTRY_SETUP.md) for configuration details.
