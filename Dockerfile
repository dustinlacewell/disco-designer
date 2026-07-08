# syntax=docker/dockerfile:1

# ---- builder: install all deps and compile TypeScript ----
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---- runtime: prod deps + compiled output only ----
FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=builder /app/dist ./dist
USER node
# Outbound-only Discord gateway client — no ports exposed.
CMD ["node", "dist/index.js"]
