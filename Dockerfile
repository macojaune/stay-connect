# Multi-stage build for AdonisJS application with Bun
FROM oven/bun:1-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile --production

# Build the application
FROM base AS builder
WORKDIR /app

# Copy package files first
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

# Copy all source code and configuration files
COPY . .

# Build the application with explicit working directory
RUN bun run build --ignore-ts-errors

# Production image
FROM base AS runner
WORKDIR /app

# Create a non-root user
RUN addgroup --system --gid 1001 bunjs
RUN adduser --system --uid 1001 adonisjs

# Copy built application from builder stage
COPY --from=builder --chown=adonisjs:bunjs /app/build ./build
COPY --from=deps --chown=adonisjs:bunjs /app/node_modules ./node_modules
COPY --from=builder --chown=adonisjs:bunjs /app/package.json /app/bun.lockb ./

# Copy other necessary files
COPY --from=builder --chown=adonisjs:bunjs /app/ace.js ./
COPY --from=builder --chown=adonisjs:bunjs /app/adonisrc.ts ./

# Switch to non-root user
USER adonisjs

# Expose port
EXPOSE 3333

# Set environment to production
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3333

# Health check using bun instead of node
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD bun ace healthcheck || exit 1

# Start the application using bun
CMD ["bun", "run", "start"]