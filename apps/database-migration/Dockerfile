ARG node_version=20.16.0-alpine

# renovate: datasource=npm packageName=prisma
ARG prisma_version=5.17.0

FROM node:${node_version} AS source
ARG prisma_version
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 worker

RUN npm i -g prisma@${prisma_version} \
  && rm -rf /root/.cache/ \
  && rm -rf /root/.npm/

COPY --chown=worker:nodejs packages/database/prisma ./prisma

USER worker

EXPOSE 3000

ENV PORT 3000

CMD [ "prisma", "migrate", "deploy" ]
