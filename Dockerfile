# syntax=docker/dockerfile:1.6

# ---------- Stage 1: build types + server + client ----------
FROM node:18-bullseye AS builder
WORKDIR /app

# Root deps (server runtime + build tooling)
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Shared types package
COPY types/package.json types/yarn.lock ./types/
RUN cd types && yarn install --frozen-lockfile

# Client deps
COPY client/package.json client/yarn.lock ./client/
RUN cd client && yarn install --frozen-lockfile

# Copy the rest of the source
COPY . .

# Build client (Vite) and server (tsc)
RUN cd client && yarn build
RUN cd server && ../node_modules/.bin/tsc --project tsconfig.server.json

# ---------- Stage 2: runtime ----------
FROM node:18-bullseye-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=2567

# Only production deps
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production && yarn cache clean

COPY types/package.json ./types/
RUN cd types && yarn install --frozen-lockfile --production && yarn cache clean

# Compiled server + types + built client
COPY --from=builder /app/server/lib ./server/lib
COPY --from=builder /app/types ./types
COPY --from=builder /app/client/dist ./client/dist

EXPOSE 2567
CMD ["node", "server/lib/server/index.js"]
