ARG node_version=24.22.1-alpine3.23@sha256:0468540aa58203ff9e40c2aab3907c52644ab818af6176b1c70a026137dc92a2

# renovate: datasource=npm packageName=prisma
ARG prisma_version=7.10.1

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
