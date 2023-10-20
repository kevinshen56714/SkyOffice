const { PeerServer } = require('peer')

const port = process.env.PEER_PORT || 9000
const path = process.env.PEER_PATH || '/'
const secret = process.env.PEER_SECRET || 'topsecret'

const peerServer = PeerServer({ port: port, path: path, secret: secret })

console.log(`PeerServer started on host ${port} with path ${path}`)
docker run --restart=always --name peerjs -d -p 9000:9000 -e PEER_PORT=9000 -e PEER_SECRET=1234567890 -e PEER_PATH=/peerjs st3v0rr/peerjs
