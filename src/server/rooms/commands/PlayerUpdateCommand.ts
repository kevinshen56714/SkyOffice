import { Command } from '@colyseus/command'
import { Client } from 'colyseus'
import { IOfficeState } from '../../../types/IOfficeState'

type Payload = {
  client: Client
  x: number
  y: number
  anim: string
}

export default class PlayerUpdateCommand extends Command<IOfficeState, Payload> {
  execute(data: Payload) {
    const { client, x, y, anim } = data

    this.room.state.players[client.sessionId].x = x
    this.room.state.players[client.sessionId].y = y
    this.room.state.players[client.sessionId].anim = anim
  }
}
