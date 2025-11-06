# syntax=docker/dockerfile:1.7
FROM node:20-alpine AS base

WORKDIR /workspace

RUN apk add --no-cache libc6-compat && corepack enable

# Workspace manifests
COPY package.json pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/tsconfig.json packages/shared/tsconfig.build.json packages/shared/src ./packages/shared/
COPY apps/api/package.json apps/api/tsconfig.json apps/api/tsconfig.build.json apps/api/eslint.config.js apps/api/src ./apps/api/

RUN pnpm install --filter @home/shared --filter @home/api --no-frozen-lockfile

WORKDIR /workspace/apps/api

RUN pnpm --filter @home/shared build && pnpm build

FROM node:20-alpine
WORKDIR /srv/app
RUN apk add --no-cache libc6-compat && corepack enable

COPY --from=base /workspace/apps/api/dist ./dist
COPY --from=base /workspace/apps/api/package.json ./package.json
COPY --from=base /workspace/apps/api/node_modules ./node_modules

ENV NODE_ENV=production
EXPOSE 5000

CMD ["node", "dist/server.js"]
