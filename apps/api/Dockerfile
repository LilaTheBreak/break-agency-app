# This Dockerfile exists only because Railway service config expects it
# Railway should use NIXPACKS instead - please update service settings in dashboard
FROM node:18-alpine

WORKDIR /app

# Copy workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
COPY apps/api ./apps/api

# Install pnpm
RUN npm install -g pnpm

# Install dependencies and build
RUN pnpm install
RUN pnpm --filter @breakagency/shared build
RUN pnpm --filter @breakagency/api exec prisma generate
RUN pnpm --filter @breakagency/api build

WORKDIR /app/apps/api

# Run migrations and start server
CMD npx prisma migrate deploy && node dist/server.js

EXPOSE 5001
