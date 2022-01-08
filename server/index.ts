import http from 'http'
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
// app.use(express.static('dist'))

const server = http.createServer(app)
const gameServer = new Server({ server })

// register room handlers
gameServer.define(RoomType.COLYSEUS_LOBBYROOM, LobbyRoom)
gameServer.define(RoomType.LOBBY, SkyOffice, {
  name: 'Public Lobby',
  roomNumber: null,
  description: 'Public area for everyone to connect and relax',
  password: null,
  autoDispose: false,
})
gameServer.define(RoomType.PUBLIC, SkyOffice, {
  name: "SkyOffice's Office",
  roomNumber: null,
  description:
    'This is to showcase how office space looks like, go to the lobby to register one for free!',
  password: null,
  autoDispose: false,
})
gameServer.define(RoomType.OFFICE, SkyOffice).enableRealtimeListing().filterBy(['roomNumber'])

/**
 * Register @colyseus/social routes
 *
 * - uncomment if you want to use default authentication (https://docs.colyseus.io/server/authentication/)
 * - also uncomment the import statement
 */
// app.use("/", socialRoutes);

// register colyseus monitor AFTER registering your room handlers
app.use('/colyseus', monitor())

gameServer.listen(port)
console.log(`Listening on ws://localhost:${port}`)
