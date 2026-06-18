ARG node_version=24.17.0-alpine3.23@sha256:dc4c98932f4f0687a667a304ba3689936dbf6f044b9de6dbfcaf5062534f0cdf

# renovate: datasource=npm packageName=prisma
ARG prisma_version=7.5.0

FROM node:${node_version} AS source
ARG prisma_version
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 worker

RUN npm i prisma@${prisma_version} \
  && rm -rf /root/.cache/ \
  && rm -rf /root/.npm/

COPY --chown=worker:nodejs packages/database/prisma ./prisma
COPY --chown=worker:nodejs packages/database/prisma.config.ts .

USER worker

EXPOSE 3000

ENV PORT=3000

CMD [ "node_modules/.bin/prisma", "migrate", "deploy" ]
