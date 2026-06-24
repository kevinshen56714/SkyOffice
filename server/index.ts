import http from 'http'
import express from 'express'
import cors from 'cors'
import { Server } from 'colyseus'
import { monitor } from '@colyseus/monitor'
import { RoomType } from '../types/Rooms'

import { SkyOffice } from './rooms/SkyOffice'

const port = Number(process.env.PORT || 2567)
const app = express()

app.use(cors())
app.use(express.json())

const server = http.createServer(app)
const gameServer = new Server({
  server,
})

// One room per workspace (INTEGRATION.md §0.1): filtering by workspaceId makes every client of a
// workspace land in the same room. The room is created on first join and configured entirely from
// the backend's session-config — there is no LOBBY / public / custom room-picker any more.
gameServer.define(RoomType.WORKSPACE, SkyOffice).filterBy(['workspaceId'])

// register colyseus monitor AFTER registering your room handlers
app.use('/colyseus', monitor())

gameServer.listen(port)
console.log(`Listening on ws://localhost:${port}`)
