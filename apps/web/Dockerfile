FROM node:22-alpine AS base

ENV PNPM_HOME="/root/.local/share/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
WORKDIR /workspace

RUN npm install -g pnpm@8

# Layer dependencies
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN pnpm install --frozen-lockfile --filter @breakagency/shared --filter @breakagency/web --recursive

# Copy source
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web

# Build shared + web
RUN pnpm --filter @breakagency/shared build && \
    pnpm --filter @breakagency/web build

FROM node:22-alpine AS runner
ENV NODE_ENV=production
WORKDIR /workspace/apps/web

COPY --from=base /workspace/apps/web/package.json ./package.json
COPY --from=base /workspace/apps/web/dist ./dist
COPY --from=base /workspace/node_modules /workspace/node_modules
COPY --from=base /workspace/apps/web/node_modules ./node_modules

EXPOSE 5173
EXPOSE 4173

CMD ["pnpm", "exec", "vite", "preview", "--host", "0.0.0.0", "--port", "4173"]
