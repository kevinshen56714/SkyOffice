#!/bin/sh
# Writes /config.js from the environment so the built client can be pointed at a
# server without rebuilding the image. The nginx entrypoint runs everything in
# /docker-entrypoint.d before starting the server.
set -eu

: "${SERVER_URL:=}"
: "${PEER_HOST:=}"
: "${PEER_PORT:=}"
: "${PEER_PATH:=}"
: "${PEER_SECURE:=}"

export SERVER_URL PEER_HOST PEER_PORT PEER_PATH PEER_SECURE

envsubst < /etc/skyoffice/config.js.template > /usr/share/nginx/html/config.js

if [ -z "$SERVER_URL" ]; then
  echo "skyoffice: SERVER_URL is not set - the client will look for a server on its own hostname at port 2567" >&2
else
  echo "skyoffice: server url set to $SERVER_URL" >&2
fi
