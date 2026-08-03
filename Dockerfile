# syntax=docker/dockerfile:1.7
FROM node:22-alpine AS base
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S merlin && adduser -S -G merlin merlin

FROM base AS build
COPY package.json ./
COPY . .
# Vendor MapLibre during the image build so the interactive map does not depend
# on a third-party JavaScript CDN at runtime. Two CDNs are attempted.
RUN mkdir -p public/vendor \
 && (wget -qO public/vendor/maplibre-gl.js https://unpkg.com/maplibre-gl@5.6.0/dist/maplibre-gl.js || wget -qO public/vendor/maplibre-gl.js https://cdn.jsdelivr.net/npm/maplibre-gl@5.6.0/dist/maplibre-gl.js) \
 && (wget -qO public/vendor/maplibre-gl.css https://unpkg.com/maplibre-gl@5.6.0/dist/maplibre-gl.css || wget -qO public/vendor/maplibre-gl.css https://cdn.jsdelivr.net/npm/maplibre-gl@5.6.0/dist/maplibre-gl.css)
RUN node scripts/preflight.js --skip-live && node scripts/verify-build.js

FROM base AS runtime
COPY --from=build --chown=merlin:merlin /app /app
RUN mkdir -p /app/runtime-data && chown -R merlin:merlin /app/runtime-data
USER merlin
EXPOSE 4173
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 CMD node scripts/healthcheck.js
CMD ["node", "server.js"]
