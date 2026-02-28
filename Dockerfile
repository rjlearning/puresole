# PureSoul - Production Dockerfile
# Multi-stage build for optimized image size

# Stage 1: Build frontend
FROM node:22-alpine AS frontend-builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --production=false

# Copy frontend source and config files
COPY client ./client
COPY shared ./shared
COPY vite.config.ts ./
COPY tsconfig.json ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./

# Build frontend only (not the backend)
RUN npx vite build

# Stage 2: Build backend
FROM node:22-alpine AS backend-builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including tsx for running TypeScript)
RUN npm ci --production=false

# Copy backend source
COPY server ./server
COPY shared ./shared
COPY tsconfig.json ./

# Note: No compilation step - we'll run TypeScript directly with tsx

# Stage 3: Production image
FROM node:22-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (need tsx to run TypeScript)
RUN npm ci && npm cache clean --force

# Copy built frontend from frontend-builder
# Copy both to dist (for potential references) and server/public (where static serving expects)
COPY --from=frontend-builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=frontend-builder --chown=nodejs:nodejs /app/dist/public ./server/public

# Copy built backend from backend-builder
COPY --from=backend-builder --chown=nodejs:nodejs /app/server ./server

# Copy shared schema
COPY --chown=nodejs:nodejs shared ./shared

# Copy config files (needed for tsx and server)
COPY --chown=nodejs:nodejs tsconfig.json ./tsconfig.json
COPY --chown=nodejs:nodejs vite.config.ts ./vite.config.ts
COPY --chown=nodejs:nodejs drizzle.config.ts ./drizzle.config.ts

# Copy database migrations
COPY --chown=nodejs:nodejs server/db/migrations ./server/db/migrations

# Copy any other necessary files
COPY --chown=nodejs:nodejs server/exports ./server/exports

# Change ownership of all files to nodejs user (including node_modules)
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Set environment to production
ENV NODE_ENV=production
ENV PORT=4000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application (run TypeScript directly with tsx)
CMD ["npx", "tsx", "server/index.ts"]
