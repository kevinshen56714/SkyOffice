import { Command } from '@colyseus/command'
import { Client } from 'colyseus'
import { IOfficeState } from '../../../types/IOfficeState'

type Payload = {
  client: Client
  computerId: string
}

export class ComputerAddUserCommand extends Command<IOfficeState, Payload> {
  execute(data: Payload) {
    const { client, computerId } = data
    const computer = this.room.state.computers.get(computerId)
    const clientId = client.sessionId
    const player = this.state.players.get(clientId)

    if (!computer) return
    if (!computer.connectedUser.has(clientId)) computer.connectedUser.add(clientId)
    if (player && !computer.connectedWebRTCId.has(player.webRTCId))
      computer.connectedWebRTCId.add(player.webRTCId)
  }
}

export class ComputerRemoveUserCommand extends Command<IOfficeState, Payload> {
  execute(data: Payload) {
    const { client, computerId } = data
    const computer = this.state.computers.get(computerId)
    const clientId = client.sessionId
    const player = this.state.players.get(clientId)

    if (computer.connectedUser.has(clientId)) {
      computer.connectedUser.delete(clientId)
    }
    if (player && computer.connectedWebRTCId.has(player.webRTCId)) {
      computer.connectedWebRTCId.delete(player.webRTCId)
    }
  }
}
