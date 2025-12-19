FROM node:22-alpine AS base

ARG NODE_ENV=production
ENV NODE_ENV=production

ENV PNPM_HOME="/root/.local/share/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
WORKDIR /workspace

RUN npm install -g pnpm@8

# Layer dependencies
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json

# Install only the needed workspaces
RUN pnpm install --frozen-lockfile --filter @breakagency/shared --filter @breakagency/api --recursive

# Copy sources
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

# Generate Prisma client now that schema is available
RUN pnpm --filter @breakagency/api prisma generate

# Build shared + api, then prune to production deps
RUN pnpm --filter @breakagency/shared build && \
    pnpm --filter @breakagency/api build && \
    pnpm prune --prod --filter @breakagency/api

FROM node:22-alpine AS runner
ENV NODE_ENV=production
WORKDIR /workspace/apps/api

COPY --from=base /workspace/apps/api/dist ./dist
COPY --from=base /workspace/apps/api/package.json ./package.json
COPY --from=base /workspace/pnpm-lock.yaml /workspace/pnpm-lock.yaml
COPY --from=base /workspace/node_modules /workspace/node_modules
COPY --from=base /workspace/apps/api/node_modules ./node_modules
COPY --from=base /workspace/apps/api/prisma ./prisma

EXPOSE 5001

CMD ["node", "dist/server.js"]
