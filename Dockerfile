# ── Build stage ─────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL deps (including devDependencies for Vite)
RUN npm install --include=dev

# Copy source and build frontend
COPY . .
RUN npm run build

# ── Production stage ─────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files and install only production deps
COPY package*.json ./
RUN npm install --omit=dev

# Copy built frontend from builder stage
COPY --from=builder /app/dist ./dist

# Copy server source
COPY server ./server
COPY src/data ./src/data

EXPOSE 3001

CMD ["node", "server/index.js"]
