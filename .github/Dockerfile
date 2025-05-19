# Single‐image monorepo container for smoke testing
FROM node:18-alpine
WORKDIR /workspace

# Install dependencies for both projects
COPY package.json package-lock.json ./
RUN npm install

# Copy everything
COPY web/ web/
COPY backend/ backend/

# Build both
RUN cd web && npm install && npm run build \
 && cd ../backend && npm install && npx tsc --skipLibCheck --noEmitOnError false

# Expose both ports
EXPOSE 3000 4000

# Default: run both with pm2 (or concurrently)
RUN npm install -g concurrently
CMD concurrently \
  "cd backend && node dist/server.js" \
  "cd web && npm start"
