# syntax=docker/dockerfile:1.7
FROM node:22-alpine AS base
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S merlin && adduser -S -G merlin merlin

FROM base AS build
COPY . .
# V18 ships a self-contained browser client and map engine. Production builds
# do not download JavaScript libraries or map assets during deployment.
RUN node scripts/preflight.js --skip-live && node scripts/verify-build.js

FROM base AS runtime
COPY --from=build --chown=merlin:merlin /app /app
RUN mkdir -p /app/runtime-data && chown -R merlin:merlin /app/runtime-data
USER merlin
EXPOSE 4173
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 CMD node scripts/healthcheck.js
CMD ["node", "server.js"]
