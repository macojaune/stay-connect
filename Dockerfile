# Multi-stage build for AdonisJS application
FROM oven/bun:1-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /home/bun/app

# Copy package files
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile --production

# Build the application
FROM base AS builder
WORKDIR /home/bun/app

# Copy package files first
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

# Copy all source code and configuration files
COPY . .

# Build the application with explicit working directory
RUN bun run build --ignore-ts-errors

# Production image
FROM base AS runner
WORKDIR /home/bun/app

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 adonisjs

# Copy built application
COPY --from=builder --chown=adonisjs:nodejs home/bun/app/build ./
COPY --from=deps --chown=adonisjs:nodejs home/bun/app/node_modules ./node_modules
COPY --from=builder --chown=adonisjs:nodejs  home/bun/app/package*.json home/bun/app/bun.lockb ./

# Switch to non-root user
USER adonisjs

# Expose port
EXPOSE 3333

# Set environment to production
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3333

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node ace healthcheck || exit 1

# Start the application
CMD ["bun", "start"]