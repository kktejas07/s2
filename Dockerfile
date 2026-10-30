# Root Dockerfile for the Dokploy app (the repo is a monorepo, so the build
# context is the repo root and the Next.js sources live in apps/web).
#
# Dokploy: Build Type = Dockerfile, Dockerfile Path = Dockerfile,
# Docker Context Path = .
#
# BACKEND_URL is read by next.config.js during `next build` and baked into the
# compiled /backend rewrite, so it must be a build arg - setting it only at
# runtime sends the proxy to localhost.

FROM node:20-alpine AS deps
WORKDIR /app
COPY apps/web/package.json apps/web/package-lock.json ./
RUN npm ci


FROM node:20-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ARG BACKEND_URL=http://localhost:8000
ENV BACKEND_URL=$BACKEND_URL
COPY --from=deps /app/node_modules ./node_modules
COPY apps/web/ ./
RUN npm run build


FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

ARG BACKEND_URL=http://localhost:8000
ENV BACKEND_URL=$BACKEND_URL

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
