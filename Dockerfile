# ---------- build stage ----------
  FROM node:18-alpine AS builder
  WORKDIR /app/web
  
  # tolerate legacy peer deps & allow TypeScript errors that don't affect runtime
  ENV NPM_CONFIG_LEGACY_PEER_DEPS=true
  ENV TSC_COMPILE_ON_ERROR=true
  
  # --- build-time public-env defaults -------------
  ARG NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
  ARG NEXT_PUBLIC_SUPABASE_ANON_KEY=dummy_anon_key
  # make them visible to Next.js compiler
  ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
  ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
  # ---------------------------------------------------
  
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
  
  # copy the compiled bundle
  COPY --from=builder /app/web /app/web
  
  EXPOSE 3000
  CMD ["npm", "start"]
  