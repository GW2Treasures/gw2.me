ARG node_version=20.12.0-alpine

FROM node:${node_version} AS source
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 worker

RUN npm i -g prisma \
  && rm -rf /root/.cache/ \
  && rm -rf /root/.npm/

COPY --chown=worker:nodejs packages/database/prisma ./prisma

USER worker

EXPOSE 3000

ENV PORT 3000

CMD [ "prisma", "migrate", "deploy" ]
