FROM node:18

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

COPY . .

RUN cd client && yarn install && cd ..
RUN cd client && yarn build && cd ..
COPY client/dist server/public

RUN yarn install
RUN yarn run heroku-postbuild


# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY server/lib skyoffice


RUN ls skyoffice

EXPOSE 8080
CMD [ "node", "skyoffice/index.js" ]