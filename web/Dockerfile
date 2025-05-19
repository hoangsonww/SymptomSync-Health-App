# ─── Stage 1: Build the Next.js app ─────────────────────────────────────────
FROM node:18-alpine AS builder
WORKDIR /app

# Allow passing BUILD_DATE at build time
ARG BUILD_DATE
ENV BUILD_DATE=${BUILD_DATE:-$(date -u +"%Y-%m-%dT%H:%M:%SZ")}

# Copy package files
COPY package*.json ./

# Install dependencies (including dev) with legacy-peer-deps to resolve conflicts
RUN npm install --legacy-peer-deps

# Copy the rest of the code and build
COPY . .
RUN npm run build

# ─── Stage 2: Production image ─────────────────────────────────────────────
FROM node:18-alpine
WORKDIR /app

# Copy only the package definitions
COPY package*.json ./

# Install only production deps with legacy-peer-deps
RUN npm install --production --legacy-peer-deps

# Copy built output
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# OCI labels for GHCR metadata
LABEL org.opencontainers.image.title="SymptomSync Frontend" \
      org.opencontainers.image.description="Production build of SymptomSync, a health management web app built with Next.js" \
      org.opencontainers.image.version="0.1.0" \
      org.opencontainers.image.licenses="MIT" \
      org.opencontainers.image.url="https://github.com/comp426-25s/final-project-team-16" \
      org.opencontainers.image.authors="David Nguyen, Erica Ocbu" \
      org.opencontainers.image.created="${BUILD_DATE}"

# Expose default Next.js port
EXPOSE 3000

# Start in production mode
CMD ["npm", "start"]
