# syntax=docker/dockerfile:1

# ---------------- Stage 1: build ----------------
FROM node:20-bookworm-slim AS builder

WORKDIR /app

# Install deps first so this layer is cached until package*.json changes
COPY package.json package-lock.json ./
RUN npm ci

# Generate the Prisma client (Prisma 7 CLI requires prisma.config.ts + schema).
# DATABASE_URL is not used by `generate`, but the config reads it at load time,
# so a dummy value keeps the CLI happy.
COPY prisma.config.ts ./
COPY prisma/schema.prisma ./prisma/schema.prisma
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npx prisma generate

# Compile TypeScript -> dist/ (includes the generated Prisma client)
COPY tsconfig.json ./
COPY server.ts ./
COPY source ./source
RUN npm run build

# ---------------- Stage 2: production runtime ----------------
FROM node:20-bookworm-slim AS runner

ENV NODE_ENV=production

WORKDIR /app

# Production dependencies only (@prisma/client + @prisma/adapter-pg live in
# dependencies; bcrypt 5.x ships prebuilt glibc binaries, so no build toolchain)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Compiled output from the builder stage
COPY --from=builder /app/dist ./dist

# Run as the unprivileged user that ships with the node image
USER node

EXPOSE 4000

# Run the server directly as PID 1 (no pm2/sudo inside containers)
CMD ["node", "dist/server.js"]
