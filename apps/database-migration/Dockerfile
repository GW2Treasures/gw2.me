ARG node_version=26.12.1-alpine3.24@sha256:40cd011b55415bc894e45b02fdd5a5dfde056921b7d23a64c74f80497af48797

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
