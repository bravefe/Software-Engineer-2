# Macau678 Purchase Approval System

## Prerequisites

- Node.js 20 LTS or newer and npm
- Docker Desktop with Docker Compose

## Local setup

From the repository root in PowerShell:

```powershell
npm install
Copy-Item server\.env.example server\.env
npm run db:up
```

Wait until PostgreSQL is healthy, then generate the Prisma Client and create/apply the local database migration:

```powershell
npm run db:generate
npm run prisma:migrate --workspace server -- --name init
```

Start the API and frontend:

```powershell
npm run dev
```

Open <http://localhost:5173>. The API listens on port 3000 and the frontend proxies `/api` requests to it. Visit <http://localhost:5173/api/ready> to check that the API can query PostgreSQL. The readiness endpoint returns HTTP 503 when the database is unavailable.

The local database is exposed on port 5432 to avoid the default PostgreSQL port. Its development-only credentials are configured in `database/docker-compose.yml` and match `server/.env.example`; do not use them outside local development.

## Container deployment

Build the production image from the repository root with `docker build -t purchase-approval .`. The image builds the client and server and serves the client from the API container. Supply `DATABASE_URL`, `CORS_ORIGIN`, and `SEED_USER_PASSWORD` through the deployment environment or a secret manager; Cloud Run supplies `PORT` and the server listens on `0.0.0.0`. Apply schema changes before deploying with `npm run db:deploy`. Run the seed only when demo accounts are needed, with `SEED_USER_PASSWORD` set. The seed can be rerun safely.

Authenticated sessions are random opaque tokens whose SHA-256 hashes and expirations are stored in PostgreSQL. Uploaded files are not currently a feature of this application, so the app does not write user uploads to local disk.

## Useful commands

```powershell
npm run build
npm run test:unit
npm run test:e2e
npm run db:down
```

The tests corresponding to `document/test.md` are currently registered as TODOs under `tests/server`, `tests/client`, and `tests/e2e`. Unit, integration/API, and component cases use Vitest; browser journey cases use Playwright. They are placeholders and do not verify application behavior until implemented.

`npm run db:down` stops the database but keeps its named volume. To remove the local database and its data, run `docker compose -f database/docker-compose.yml down --volumes`.

## Project layout

- `client/` - React, TypeScript, Vite, Bootstrap, and client-side routes
- `server/` - Express API, TypeScript, Prisma schema, and database access
- `database/docker-compose.yml` - local PostgreSQL service
