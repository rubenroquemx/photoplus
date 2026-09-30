# syntax=docker/dockerfile:1

FROM node:20-alpine AS base

# Install libc6-compat & python for sharp/native modules if needed
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Dependencies stage
FROM base AS deps
COPY package.json package-lock.json ./
COPY prisma ./prisma/
RUN npm ci

# Builder stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Run prisma generate and build next.js
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npx prisma generate
RUN npm run build

# Production runner stage
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3005
ENV HOSTNAME="0.0.0.0"

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Create data directory for persistent SQLite database
RUN mkdir -p /app/prisma && chown -R nextjs:nodejs /app/prisma

# Copy standalone build
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs

EXPOSE 3005

CMD ["node", "server.js"]
