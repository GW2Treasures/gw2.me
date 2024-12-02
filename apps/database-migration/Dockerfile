ARG node_version=22.11.0-alpine

# renovate: datasource=npm packageName=prisma
ARG prisma_version=6.0.1

FROM node:${node_version} AS source
ARG prisma_version
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 worker

RUN npm i -g prisma@${prisma_version} \
  && rm -rf /root/.cache/ \
  && rm -rf /root/.npm/

COPY --chown=worker:nodejs packages/database/prisma ./prisma

USER worker

EXPOSE 3000

ENV PORT=3000

CMD [ "prisma", "migrate", "deploy" ]
