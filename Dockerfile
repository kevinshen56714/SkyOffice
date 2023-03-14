FROM node:18
# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json .
COPY node_modules ./server/node_modules
COPY /server/lib/types ./types
COPY /server/lib/server ./server
COPY /client/dist ./server/public

WORKDIR /usr/src/app/server
EXPOSE 2567
CMD [ "node", "index.js" ]
