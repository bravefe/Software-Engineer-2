# ==============================================================================
# Macau678 Purchase Approval System — frontend Dockerfile for Compose
# ==============================================================================
# Used by docker-compose.yml (`client` service on http://localhost:5173).
# Cloud Run does NOT use this file — Cloud Run serves the built SPA from the
# root `Dockerfile`.
# Ref: https://docs.docker.com/build/building/multi-stage/
#
# ==============================================================================

# --- Stage 1: Build static frontend files -------------------------------------
FROM node:24-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY client/package.json ./client/package.json
COPY server/package.json ./server/package.json
RUN npm ci

COPY client/ ./client/
RUN npm run build --workspace client

# --- Stage 2: Serve built files with nginx (proxies /api -> server:3000) ------
FROM nginx:stable-alpine
COPY client/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/client/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
