FROM node:18

RUN npm i peer -g

CMD ["/bash", "-c", "peerjs", "--port", "${PORT:-9000}", "--key", "${SECRET}", "--path", "${PATH:-/skyoffice}"]
