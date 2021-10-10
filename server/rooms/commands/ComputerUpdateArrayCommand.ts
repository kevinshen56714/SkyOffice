import { Command } from '@colyseus/command'
import { Client } from 'colyseus'
import { IOfficeState } from '../../../types/IOfficeState'

type Payload = {
  client: Client
  computerId: string
}

export default class ComputerUpdateArrayCommand extends Command<IOfficeState, Payload> {
  execute(data: Payload) {
    const { client, computerId } = data
    const clientId = client.sessionId

    const computer = this.room.state.computers.get(computerId)

    if (!computer || computer.connectedUser.includes(clientId)) return
    computer.connectedUser.push(clientId)
  }
}
