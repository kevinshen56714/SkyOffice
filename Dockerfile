# Colyseus game server.
#
# The server reads the Tiled map at runtime to place items and validate player
# positions, so the runtime image carries client/public/assets/map/map.json at
# the path MapObjects.ts expects to find it (four levels up from the compiled
# server/lib/server/rooms).

FROM node:18-alpine AS build
WORKDIR /app

# bcrypt is a native module; alpine needs a toolchain to build it
RUN apk add --no-cache python3 make g++

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY types/package.json types/yarn.lock ./types/
RUN cd types && yarn install --frozen-lockfile

COPY tsconfig*.json ./
COPY types ./types
COPY server ./server
RUN yarn build

# drop dev dependencies from the tree we are about to copy over
RUN yarn install --frozen-lockfile --production --ignore-scripts && yarn cache clean


FROM node:18-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=2567
ENV OFFICE_STORE_PATH=/app/data/offices.json

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/server/lib ./server/lib
COPY --from=build /app/package.json ./package.json

# the one client asset the server needs
COPY client/public/assets/map/map.json ./client/public/assets/map/map.json

# Offices with a lifetime are recorded here so their links survive the room
# being disposed and the container being restarted. Created before the volume
# is mounted so it inherits an ownership the unprivileged user can write to.
RUN mkdir -p /app/data && chown -R node:node /app/data
VOLUME ["/app/data"]

# node:alpine ships an unprivileged `node` user
USER node

EXPOSE 2567

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:'+(process.env.PORT||2567)+'/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "server/lib/server/index.js"]
