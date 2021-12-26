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

    if (!computer || computer.connectedUser.includes(clientId)) return
    computer.connectedUser.push(clientId)
  }
}

export class ComputerRemoveUserCommand extends Command<IOfficeState, Payload> {
  execute(data: Payload) {
    const { client, computerId } = data
    const computer = this.state.computers.get(computerId)
    const index = computer.connectedUser.indexOf(client.sessionId)

    if (index > -1) {
      computer.connectedUser.splice(index, 1)
    }
  }
}
