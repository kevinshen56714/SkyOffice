import { Command } from '@colyseus/command'
import { Client } from 'colyseus'
import { IOfficeState } from '../../../types/IOfficeState'

type Payload = {
  client: Client
  whiteboardId: string
}

export class WhiteboardAddUserCommand extends Command<IOfficeState, Payload> {
  execute(data: Payload) {
    const { client, whiteboardId } = data
    const whiteboard = this.room.state.whiteboards.get(whiteboardId)
    const clientId = client.sessionId

    if (!whiteboard || whiteboard.connectedUser.includes(clientId)) return
    whiteboard.connectedUser.push(clientId)
  }
}

export class WhiteboardRemoveUserCommand extends Command<IOfficeState, Payload> {
  execute(data: Payload) {
    const { client, whiteboardId } = data
    const whiteboard = this.state.whiteboards.get(whiteboardId)
    const index = whiteboard.connectedUser.indexOf(client.sessionId)

    if (index > -1) {
      whiteboard.connectedUser.splice(index, 1)
    }
  }
}
