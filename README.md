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

Open <http://localhost:5173>. The API listens on port 3000 and the frontend proxies `/api` requests to it. Visit <http://localhost:5173/health> to check that the browser reaches the API and the API can query PostgreSQL. The health endpoint returns HTTP 503 when the database is unavailable.

The local database is exposed on port 5432 to avoid the default PostgreSQL port. Its development-only credentials are configured in `database/docker-compose.yml` and match `server/.env.example`; do not use them outside local development.

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
