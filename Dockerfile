# =========================================================================
# Multi-Stage Production Dockerfile for Blogora Backend
# =========================================================================

# Stage 1: Dependencies Cache
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build
# Prune development dependencies for minimal production footprint
RUN npm prune --production

# Stage 3: Production Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Create unprivileged user for container security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 blogora && \
    chown -R blogora:nodejs /app

# Copy production artifacts
COPY --from=builder --chown=blogora:nodejs /app/package.json ./package.json
COPY --from=builder --chown=blogora:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=blogora:nodejs /app/dist ./dist

USER blogora

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/auth/me || exit 0

CMD ["node", "dist/app.js"]
