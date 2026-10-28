FROM node:lts-alpine AS base
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S appuser -u 1001 && \
    chown -R appuser:nodejs /app
USER appuser

# === Download production environment dependencies ===
FROM base AS deps
COPY package*.json ./
RUN npm install --only=prod --no-audit --no-fund --no-optional --ignore-scripts && \
    npm cache clean --force

FROM base AS builder
COPY package*.json ./
RUN npm install --no-audit --no-fund --no-optional --ignore-scripts

RUN mkdir -p public

COPY . .
RUN npm run build

# === Build final image ===
FROM base AS final
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/build ./build

COPY --from=builder /app/public ./public

EXPOSE 1122
CMD ["node", "build/index.js", "--transport", "streamable", "--host", "0.0.0.0", "--port", "1122", "--endpoint", "/mcp"]
