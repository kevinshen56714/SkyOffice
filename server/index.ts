import http from 'http'
import path from 'path'
import express from 'express'
import cors from 'cors'
import { Server, LobbyRoom } from 'colyseus'
import { monitor } from '@colyseus/monitor'
import { RoomType } from '../types/Rooms'

// import socialRoutes from "@colyseus/social/express"

import { SkyOffice } from './rooms/SkyOffice'

const port = Number(process.env.PORT || 2567)
const app = express()

app.use(cors())
app.use(express.json())

const staticDir =
  process.env.CLIENT_DIST_DIR || path.resolve(__dirname, '..', '..', '..', 'client', 'dist')
app.use(express.static(staticDir))

const server = http.createServer(app)
const gameServer = new Server({
  server,
})

// register room handlers
gameServer.define(RoomType.LOBBY, LobbyRoom)
gameServer.define(RoomType.PUBLIC, SkyOffice, {
  name: 'Public Lobby',
  description: 'For making friends and familiarizing yourself with the controls',
  password: null,
  autoDispose: false,
})
gameServer.define(RoomType.CUSTOM, SkyOffice).enableRealtimeListing()

/**
 * Register @colyseus/social routes
 *
 * - uncomment if you want to use default authentication (https://docs.colyseus.io/server/authentication/)
 * - also uncomment the import statement
 */
// app.use("/", socialRoutes);

// register colyseus monitor AFTER registering your room handlers
app.use('/colyseus', monitor())

// SPA fallback — send index.html for any non-API, non-asset route
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/colyseus') || req.path.startsWith('/matchmake')) return next()
  res.sendFile(path.join(staticDir, 'index.html'))
})

gameServer.listen(port)
console.log(`Listening on ws://localhost:${port}`)
