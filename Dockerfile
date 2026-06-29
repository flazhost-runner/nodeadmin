# NodeAdmin starter kit (nodeadmin-app) — FlazHost PaaS build context.
#
# Single-stage image on node:20-alpine. The container:
#   - builds the app (tsc + `nodeadmin copy-views`)
#   - runs TypeORM migrations on boot (idempotent), then `node dist/index.js`
#   - listens on $APP_PORT (default 80) for CapRover
#   - defaults to a zero-config SQLite DB and a bundled local Redis, while
#     allowing a fully managed DB / Redis via environment variables.
#
# NOTE: migrations are executed with ts-node against ./src/config/ormconfig.ts
# (the migrations glob targets *.ts), so devDependencies (typescript, ts-node,
# typeorm, @flazhost-nodeadmin/cli) are intentionally kept in the final image.
FROM node:20-alpine

WORKDIR /app

# Runtime extras:
#   - redis       : bundled local session/cache store for zero-config deploys
#   - tini        : proper PID 1 / signal handling (graceful SIGTERM shutdown)
# Build toolchain (python3/make/g++) is needed to compile the better-sqlite3
# native addon and is removed again after install to keep the image lean.
COPY package.json ./
RUN apk add --no-cache redis tini \
 && apk add --no-cache --virtual .build-deps python3 make g++ \
 && npm install --include=dev --no-audit --no-fund \
 && apk del .build-deps

# App source + build (tsc -> dist, then copy .ejs views into dist)
COPY . .
RUN npm run build

# Writable location for the default SQLite database file (and runtime secrets).
RUN mkdir -p /app/data

# --- Defaults: zero-config boot, every value overridable via env ---
ENV APP_PORT=80 \
    APP_HOST="http://localhost" \
    APP_MODE=full \
    DB_TYPE=better-sqlite3 \
    DB_DATABASE=/app/data/dev.sqlite \
    REDIS_URL=redis://127.0.0.1:6379

EXPOSE 80

ENTRYPOINT ["/sbin/tini", "--", "/app/docker-entrypoint.sh"]
