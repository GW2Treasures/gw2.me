ARG node_version=24.15.0-alpine3.22@sha256:b689d4005875ae167178471a7a622ec2909459a3bbb32277260be1971af7a99f

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
