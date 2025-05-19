# ─── Stage 1: Build the Next.js app ─────────────────────────────────────────
FROM node:18-alpine AS builder
WORKDIR /app

# Build-time argument for timestamp
ARG BUILD_DATE
# Expose it as an environment variable
ENV BUILD_DATE=${BUILD_DATE}

# Copy package files and install with legacy-peer-deps to avoid conflicts
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy source & build
COPY . .
RUN npm run build

# ─── Stage 2: Production image ─────────────────────────────────────────────
FROM node:18-alpine
WORKDIR /app

# Copy only production deps
COPY package*.json ./
RUN npm install --production --legacy-peer-deps

# Copy built output
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# OCI labels
LABEL org.opencontainers.image.title="SymptomSync Frontend" \
      org.opencontainers.image.description="Production build of SymptomSync, a health management web app built with Next.js" \
      org.opencontainers.image.version="0.1.0" \
      org.opencontainers.image.licenses="MIT" \
      org.opencontainers.image.url="https://github.com/comp426-25s/final-project-team-16" \
      org.opencontainers.image.authors="David Nguyen, Erica Ocbu" \
      org.opencontainers.image.created="${BUILD_DATE}"

EXPOSE 3000

CMD ["npm", "start"]
