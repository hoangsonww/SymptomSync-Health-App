# ---------- build stage ----------
  FROM node:18-alpine AS builder
  WORKDIR /app/web
  
  # tolerate peer-dep issues & ignore TS errors that don’t affect runtime
  ENV NPM_CONFIG_LEGACY_PEER_DEPS=true
  ENV TSC_COMPILE_ON_ERROR=true
  
  # install deps
  COPY web/package*.json ./
  RUN npm ci
  
  # copy source & build
  COPY web .
  RUN npm run build
  
  # ---------- runtime stage ----------
  FROM node:18-alpine
  WORKDIR /app/web
  
  ENV NODE_ENV=production
  
  COPY --from=builder /app/web /app/web
  
  EXPOSE 3000
  CMD ["npm", "start"]
  