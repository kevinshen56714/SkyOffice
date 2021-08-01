import { Room, Client } from 'colyseus'
import { Dispatcher } from '@colyseus/command'
import { Player, OfficeState } from './schema/OfficeState'
import { Message } from '../../types/Messages'
import PlayerUpdateCommand from './commands/PlayerUpdateCommand'

export class SkyOffice extends Room<OfficeState> {
  private dispatcher = new Dispatcher(this)

  onCreate(options: any) {
    this.setState(new OfficeState())

    // when receiving updatePlayer message, call the PlayerUpdateCommand
    this.onMessage(
      Message.UPDATE_PLAYER,
      (client, message: { x: number; y: number; anim: string }) => {
        this.dispatcher.dispatch(new PlayerUpdateCommand(), {
          client,
          x: message.x,
          y: message.y,
          anim: message.anim,
        })
      }
    )

    this.onMessage(Message.READYTOCONNECT, (client) => {
      this.broadcast(Message.READYTOCONNECT, client.sessionId, { except: client })
    })
  }

  onJoin(client: Client, options: any) {
    this.state.players.set(client.sessionId, new Player())
  }

  onLeave(client: Client, consented: boolean) {
    if (this.state.players.has(client.sessionId)) {
      this.state.players.delete(client.sessionId)
    }
  }

  onDispose() {
    console.log('room', this.roomId, 'disposing...')
  }
}
