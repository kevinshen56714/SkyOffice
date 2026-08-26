# Static client, served by nginx.
#
# VITE_* values are inlined at build time, which would mean a rebuild per
# deployment. Instead the entrypoint writes /config.js from the environment at
# container start, so one image can be pointed anywhere from the Portainer UI.

FROM node:18-alpine AS build
WORKDIR /app

COPY client/package.json client/yarn.lock ./client/
RUN cd client && yarn install --frozen-lockfile

COPY types/package.json types/yarn.lock ./types/
RUN cd types && yarn install --frozen-lockfile

COPY types ./types
COPY client ./client
RUN cd client && yarn build


FROM nginx:1.27-alpine AS runtime

COPY --from=build /app/client/dist /usr/share/nginx/html
COPY client/nginx.conf /etc/nginx/conf.d/default.conf
COPY client/config.js.template /etc/skyoffice/config.js.template
COPY client/docker-entrypoint.sh /docker-entrypoint.d/40-skyoffice-config.sh
RUN chmod +x /docker-entrypoint.d/40-skyoffice-config.sh

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1/ || exit 1
