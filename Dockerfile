# =============================================================================
# Legajo Digital — Dockerfile
# =============================================================================
# Multi-stage build:
#   1. Dependencies layer (cached for faster rebuilds)
#   2. Production image (slim)
# =============================================================================

# ---- Stage 1: Dependencies ----
FROM oven/bun:1.2 AS deps

WORKDIR /app

# Copy dependency files first (layer caching)
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

# ---- Stage 2: Production ----
FROM oven/bun:1.2-alpine AS production

WORKDIR /app

# Copy only what's needed
COPY --from=deps /app/node_modules ./node_modules
COPY server.js .
COPY index.html .

# Create data directory with proper permissions
RUN mkdir -p /app/datos_locales && chmod 755 /app/datos_locales

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Port
EXPOSE 3000

# Volume for persistent data
VOLUME /app/datos_locales

# Run as non-root user
USER nobody

# Start server
ENV HOST=0.0.0.0
ENV PORT=3000
CMD ["bun", "server.js"]
