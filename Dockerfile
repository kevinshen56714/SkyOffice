FROM node:18
# Create app build directory
WORKDIR /usr/src/skyoffice/build

COPY ./ ./

RUN yarn &&\
    yarn build
WORKDIR /usr/src/skyoffice/build/client
RUN yarn &&\
    yarn build

WORKDIR /
RUN cp -R /usr/src/skyoffice/build/server/lib /opt/skyoffice &&\
    mv /usr/src/skyoffice/build/node_modules /opt/skyoffice/server &&\
    cp -R /usr/src/skyoffice/build/client/dist /opt/skyoffice/server/public &&\
    rm -rf /usr/src/skyoffice

WORKDIR /opt/skyoffice/server
EXPOSE 2567
CMD [ "node", "index.js" ]
