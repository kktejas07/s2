# Next.js web app. Two targets: `dev` for docker-compose.yml, `runner` for
# docker-compose.prod.yml.
#
# next.config.js already sets output: "standalone", so the production image
# carries a self-contained server and only the node_modules it actually
# reaches - rather than the full install, which for this app is most of the
# image.

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci


# ---------------------------------------------------------------------- dev
# Source is bind-mounted over this by compose; the image exists for the
# installed node_modules, which must not come from the host (they are built
# against the container's platform, and the host may be macOS or Windows).
FROM node:20-alpine AS dev
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]


# -------------------------------------------------------------------- build
FROM node:20-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# The fonts are fetched from Google at build time by next/font. A build host
# without egress to fonts.googleapis.com fails here rather than silently
# shipping a page with no typeface.
RUN npm run build


# ------------------------------------------------------------------- runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Not root: the server needs nothing on the filesystem beyond what it ships
# with, so there is no reason to let a request-handling process write to it.
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
