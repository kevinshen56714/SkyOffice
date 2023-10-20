const { PeerServer } = require('peer')

const port = process.env.PEER_PORT || 9000
const proxied = process.env.PEER_PROXIED || false
const path = process.env.PEER_PATH || '/'
const secret = process.env.PEER_SECRET || 'peerjs'

const peerServer = PeerServer({ port: port, path: path, key: secret, proxied: proxied })
peerServer.on('connection', (client) => {
  console.log('Client connected', client)
})
peerServer.on('disconnect', (client) => {
  console.log('Client disconnected', client)
})
console.log(`PeerServer started on host ${port} with path ${path}`)
