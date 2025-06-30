# Multi-stage build for production
FROM node:22-alpine AS base

# Install pnpm globally
RUN npm install -g pnpm

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

# Build the application
FROM base AS builder
WORKDIR /app

# Accept build arguments for Umami
ARG UMAMI_SCRIPT_URL
ARG UMAMI_WEBSITE_ID

# Copy all source code and configuration files
COPY . .

# Copy package files first
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Set Umami environment variables
ENV UMAMI_SCRIPT_URL=$UMAMI_SCRIPT_URL
ENV UMAMI_WEBSITE_ID=$UMAMI_WEBSITE_ID

# Build the application
RUN pnpm run build --ignore-ts-errors

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