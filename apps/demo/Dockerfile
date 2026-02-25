ARG node_version=24.14.0-alpine3.22

# renovate: datasource=npm packageName=turbo
ARG turbo_version=2.8.11
# renovate: datasource=npm packageName=pnpm
ARG pnpm_version=10.30.2

FROM --platform=$BUILDPLATFORM node:${node_version} AS source
ARG turbo_version
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat \
  && npm i -g turbo@${turbo_version}
WORKDIR /source
COPY . .
RUN turbo prune demo --docker

# Install dependencies only when needed
FROM --platform=$BUILDPLATFORM node:${node_version} AS builder
ARG pnpm_version
RUN apk add --no-cache libc6-compat \
  && npm i -g pnpm@${pnpm_version}
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# Install dependencies based on the preferred package manager
COPY --from=source /source/out/json/ .

RUN pnpm install --frozen-lockfile

COPY --from=source /source/out/full/ .

RUN pnpm run build --filter=demo

# Production image, copy all the files and run next
FROM node:${node_version} AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/demo/package.json .

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/apps/demo/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/demo/.next/static ./apps/demo/.next/static
#COPY --from=builder --chown=nextjs:nodejs /app/apps/demo/public ./apps/demo/public

USER nextjs

EXPOSE 3000

ENV PORT=3000

CMD [ "node", "apps/demo/server.js" ]
