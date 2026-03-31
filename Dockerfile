# ---- Build Stage ----
FROM node:20-alpine AS base

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

WORKDIR /app

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# ---- App Stage ----
FROM node:20-alpine

RUN apk add --no-cache dumb-init

# Run as non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

WORKDIR /app

# Copy installed modules from build stage
COPY --from=base --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy application source
COPY --chown=nodejs:nodejs src/ ./src/
COPY --chown=nodejs:nodejs public/ ./public/
COPY --chown=nodejs:nodejs data/ ./data/
COPY --chown=nodejs:nodejs config/ ./config/
COPY --chown=nodejs:nodejs package.json ./

# Copy root-level JS/HTML files served as static assets
COPY --chown=nodejs:nodejs app.js exportFunctions.js index.html ./
COPY --chown=nodejs:nodejs render*.js ./

# Create logs directory
RUN mkdir -p logs && chown nodejs:nodejs logs

USER nodejs

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/server/index.js"]
