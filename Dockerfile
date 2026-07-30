# syntax=docker/dockerfile:1.7
FROM node:22-alpine AS base
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S summit && adduser -S -G summit summit

FROM base AS build
COPY package.json ./
COPY . .
RUN node scripts/preflight.js --skip-live && node scripts/verify-build.js

FROM base AS runtime
COPY --from=build --chown=summit:summit /app /app
RUN mkdir -p /app/runtime-data && chown -R summit:summit /app/runtime-data
USER summit
EXPOSE 4173
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 CMD node scripts/healthcheck.js
CMD ["node", "server.js"]
