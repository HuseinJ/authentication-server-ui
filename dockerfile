# =========================
# Builder stage
# =========================
FROM node:22-slim AS builder

WORKDIR /app

COPY package*.json ./

ARG BACKEND_API_URL

RUN npm ci

COPY . .

RUN VITE_BACKEND_API=$BACKEND_API_URL npm run build

RUN npm prune --production

# =========================
# Production stage
# =========================
FROM node:22-slim

WORKDIR /app

COPY --from=builder /app/build build/
COPY --from=builder /app/node_modules node_modules/
COPY package.json .

EXPOSE 3000

ENV NODE_ENV=production

# Run the app
CMD ["node", "build"]
