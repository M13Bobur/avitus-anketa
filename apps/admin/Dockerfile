FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY apps/admin/package.json ./apps/admin/

RUN npm install --workspace=@avitus/shared-types --workspace=@avitus/admin --include-workspace-root

COPY packages/shared-types ./packages/shared-types
COPY apps/admin ./apps/admin

RUN npm run build --workspace=@avitus/shared-types
RUN npm run build --workspace=@avitus/admin

FROM scratch AS export
COPY --from=builder /app/apps/admin/dist /
