ARG node_version=24.18.1-alpine3.23@sha256:c2cc26d8f991c2db236ad51a61efee843c482372d6d22570787309d511694110

# renovate: datasource=npm packageName=prisma
ARG prisma_version=7.9.1

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
