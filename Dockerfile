# Multi-stage build for production
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

# Copy package files first
COPY package*.json ./
RUN npm ci

# Copy all source code and configuration files
COPY . .

# Build the application
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 adonisjs

# Copy built application from builder stage
COPY --from=builder --chown=adonisjs:nodejs /app/build ./
COPY --from=deps --chown=adonisjs:nodejs /app/node_modules ./node_modules

# Switch to non-root user
USER adonisjs

# Expose port
EXPOSE 3333

# Set environment to production
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3333

# Start the application using Node.js
CMD ["node", "bin/server.js"]