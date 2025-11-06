# syntax=docker/dockerfile:1.7
FROM node:20-alpine AS base

WORKDIR /workspace

RUN apk add --no-cache libc6-compat && corepack enable

COPY package.json pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/

RUN pnpm install --filter @home/web --no-frozen-lockfile

COPY . .

WORKDIR /workspace/apps/web

RUN pnpm build

FROM node:20-alpine
WORKDIR /srv/app
RUN apk add --no-cache libc6-compat && corepack enable

COPY --from=base /workspace/apps/web/dist ./dist
COPY --from=base /workspace/apps/web/package.json ./package.json
COPY --from=base /workspace/apps/web/node_modules ./node_modules

ENV NODE_ENV=production
EXPOSE 4173

CMD ["pnpm", "preview", "--host", "0.0.0.0", "--port", "4173"]
