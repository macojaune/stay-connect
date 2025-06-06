# Multi-stage build for AdonisJS application
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Build the application
FROM base AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 adonisjs

# Copy built application
COPY --from=builder --chown=adonisjs:nodejs /app/build ./
COPY --from=deps --chown=adonisjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=adonisjs:nodejs /app/package*.json ./

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
CMD ["node", "bin/server.js"]