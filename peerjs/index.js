const { PeerServer } = require('peer')

const port = process.env.PEER_PORT || 9000
const path = process.env.PEER_PATH || '/'
const secret = process.env.PEER_SECRET || 'topsecret'

const peerServer = PeerServer({ port: port, path: path, key: secret })

console.log(`PeerServer started on host ${port} with path ${path}`)
