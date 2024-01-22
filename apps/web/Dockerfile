ARG node_version=20.11.0-alpine

FROM --platform=$BUILDPLATFORM node:${node_version} AS source
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /source
RUN npm i -g turbo
COPY . .
RUN turbo prune --scope=web --docker

# Install dependencies only when needed
FROM --platform=$BUILDPLATFORM node:${node_version} AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED 1

# Install dependencies based on the preferred package manager
COPY --from=source /source/out/json/ .
COPY --from=source /source/out/package-lock.json package-lock.json

RUN npm ci --cpu $TARGETPLATFORM
RUN npm i @rollup/rollup-linux-x64-musl

COPY --from=source /source/out/full/ .

RUN npm run build -- --filter=web...

# Production image, copy all the files and run next
FROM --platform=$TARGETPLATFORM node:${node_version} AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

RUN npm install sharp --include=optional

# COPY --from=builder /app/apps/web/public ./public
COPY --from=builder /app/apps/web/next.config.js .
COPY --from=builder /app/apps/web/package.json .

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
# COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD [ "node", "apps/web/server.js" ]
