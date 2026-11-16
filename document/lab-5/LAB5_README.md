# CPE 334 Lab 5 Starter Files

These Lab 5 deployment files are adapted to the Macau678 Purchase Approval System in this repository. The app is a React/Vite frontend, Express API, and Prisma/PostgreSQL database; the deployed seed creates the project's requester and reviewer accounts, not an administrator or catalog data.

The Cloud Run image serves the built React app and API from one container. The local Compose setup keeps nginx and the API separate.

## What is in this folder

| File | What it does |
|---|---|
| `server/Dockerfile`, `client/Dockerfile`, `client/nginx.conf` | Local Compose images for the API and nginx frontend. They build from the repository root to use the root npm workspace lockfile. |
| `Dockerfile`, `.dockerignore` | Multi-stage Cloud Run image. The Express API serves the built React SPA on port 3000 as the non-root `node` user. |
| `docker-compose.yml` | Runs PostgreSQL, migrations and seed, the API (`localhost:3000`) and nginx frontend (`localhost:5173`) locally. |
| `client/.env.example` | Local Vite port and API proxy target. API calls in the SPA use same-origin `/api` paths. |
| `server/docker-entrypoint.sh` | Starts the server and nothing else. Migrations run in a separate Cloud Run job. |
| `.github/workflows/ci-docker.yml` | Runs on every Pull Request: PostgreSQL service, migrate and seed, backend and frontend tests, deploy script tests, Docker build. The job name `test-and-docker` is the required check for the ruleset. |
| `.github/workflows/deploy.yml` | Runs on every merge into `main`: CI again, build and push the image tagged with the commit SHA, migration job, Cloud Run update, smoke test. Run it by hand with `image_tag` to roll back. |
| `deploy/deploy.sh` | One-time setup and first deploy: APIs, Artifact Registry, Cloud SQL, secrets, runtime service account, migration job, and Cloud Run service. Run with `DRY_RUN=1` first. |
| `deploy/release.sh` | Called by `deploy.yml`. Checks the image exists, reads its digest, runs the migration job, and updates the service. |
| `deploy/smoke_test.py` | Checks the database-backed `/api/health`, the SPA at `/`, and optionally cookie-based login/me/logout. |
| `deploy/teardown.sh` | Deletes the cloud resources after the course. |
| `deploy/tests/` | Offline tests for the deploy scripts. CI runs them. |
| `.github/dependabot.yml` | Opens a Pull Request every week when a GitHub Action used by the workflows has a newer version. |
| `document/lab-5/gcp-first-lab.md` | Step-by-step first deploy from Cloud Shell. |
| `document/lab-5/gcp-cicd-guide.md` | GCP setup, local run, CI, troubleshooting, and cost. |
| `document/lab-5/auto-deploy.md` | Workload Identity Federation, GitHub environment and variables, ruleset, and rollback. |

The guides are in English. The TA team wrote them during their own rehearsal. Values such as `YOUR_PROJECT_ID`, `YOUR_PROJECT_NUMBER`, and `YOUR_ORG/YOUR_REPO` are placeholders for your own. Commit SHAs and revision names in the guides are examples from the rehearsal.

## Order of work

0. Follow the Lab 5 Student Guide (the episode series from the TA team). This folder is the material it points to.
1. Run your app locally in production mode, then with `docker compose up --build`.
2. Run the app in Docker Compose and confirm migrations, seeded requester/reviewer accounts, and same-origin API access.
3. Add `ci-docker.yml` and open a Pull Request to see the checks run.
4. Confirm billing is open and create a budget alert. In Cloud Shell, run `DRY_RUN=1 PROJECT_ID=YOUR_PROJECT_ID bash deploy/deploy.sh`, read the output, then run it without `DRY_RUN`. The script stores the seeded users' shared password in Secret Manager; retrieve it only when needed and do not put it in source control or workflow logs.
5. Follow `document/lab-5/auto-deploy.md` to create the deploy service account, Workload Identity Federation, the GitHub environment `demo`, and the ruleset for `main`.
6. Add `deploy.yml` and merge a small change into `main`.

## GitHub settings that deploy.yml expects

Environment `demo`, deployable only from `main`, with these variables:

| Name | Example |
|---|---|
| `GCP_PROJECT_ID` | `YOUR_PROJECT_ID` |
| `GCP_REGION` | `asia-southeast1` |
| `WIF_PROVIDER` | `projects/YOUR_PROJECT_NUMBER/locations/global/workloadIdentityPools/github-actions/providers/github-main` |
| `WIF_SERVICE_ACCOUNT` | `macau678-deployer@YOUR_PROJECT_ID.iam.gserviceaccount.com` |

Optional: `SMOKE_EMAIL` as a variable and `SMOKE_PASSWORD` as a secret, for the sign-in check. Set both or neither.

Ruleset for `main`: Enforcement Active, empty bypass list, Require a pull request, Require status checks to pass with `test-and-docker` selected through Add checks, and Require branches to be up to date.

## What to change for your project

- Deployment resources use the `macau678` prefix; the service is `macau678-purchase-approval`. Keep names consistent across `deploy/deploy.sh`, `deploy/release.sh`, `deploy/teardown.sh`, and `deploy.yml`.
- `Dockerfile`: the build commands, the paths copied into the final image, and the port. The final image must contain every file the server and the seed need at run time.
- `ci-docker.yml`: the install, migrate, seed, test, and build commands for your stack.
- `deploy/deploy.sh` and `release.sh`: the migration job command (`prisma migrate deploy` and the seed) and the secrets your app reads.
- `deploy/smoke_test.py`: keep checks aligned with `/api/health`, the SPA, and cookie-based authentication. Use a dedicated test account for optional login checks.
- Leave alone unless you know why: Workload Identity Federation instead of JSON keys, actions pinned to full commit SHAs, the image tag being the full commit SHA, deploying by image digest, and the `if` conditions on the `test` and `deploy` jobs that make rollback work.

## Rollback

Actions > Deploy demo > Run workflow on `main`, then enter the full 40-character commit SHA of the last release that worked. The workflow skips tests, build, and migration, deploys that image, and runs the smoke test. The database schema is not rolled back, so keep migrations additive.

## Cost

Cloud SQL is billed for every hour it exists. The TA team estimated about USD 14 to 18 per project per month with light use in October 2026. Create the budget alert before anything else, and run `deploy/teardown.sh` when the course ends.
