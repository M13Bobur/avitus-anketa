FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY apps/backend/package.json ./apps/backend/
COPY apps/admin/package.json ./apps/admin/

RUN npm ci --workspace=@avitus/shared-types --workspace=@avitus/backend --workspace=@avitus/admin --include-workspace-root

COPY packages/shared-types ./packages/shared-types
COPY apps/backend ./apps/backend
COPY apps/admin ./apps/admin

RUN npm run build --workspace=@avitus/shared-types

ENV NEXT_PUBLIC_API_URL=/api
RUN npm run build --workspace=@avitus/admin

RUN npm run build --workspace=@avitus/backend

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
ENV NODE_OPTIONS="--max-old-space-size=384"

RUN apk add --no-cache tini

COPY package.json package-lock.json ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY apps/backend/package.json ./apps/backend/

RUN npm ci --workspace=@avitus/shared-types --workspace=@avitus/backend --include-workspace-root --omit=dev

COPY --from=builder /app/packages/shared-types/dist ./packages/shared-types/dist
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/admin/dist ./apps/admin/dist

COPY apps/backend/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh \
  && mkdir -p /app/uploads /app/apps/backend/logs

WORKDIR /app/apps/backend

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=10s --start-period=90s --retries=5 \
  CMD node -e "require('http').get('http://127.0.0.1:3000/api/docs', (r) => process.exit(r.statusCode < 500 ? 0 : 1)).on('error', () => process.exit(1))"

ENTRYPOINT ["/sbin/tini", "--", "docker-entrypoint.sh"]
CMD ["node", "dist/index.js"]
