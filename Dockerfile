FROM node:18
COPY . .

RUN yarn \
 && yarn build \
 && yarn -cwd ${PWD}/client \
 && yarn -cwd ${PWD}/client build \
 && cp -R /server/lib /opt/skyoffice \
 && mv /node_modules /opt/skyoffice/server \
 && cp -R /client/dist /opt/skyoffice/server/public

WORKDIR /opt/skyoffice/server
EXPOSE 2567
CMD [ "node", "index.js" ]
