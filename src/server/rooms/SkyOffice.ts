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
      Message.updatePlayer,
      (client, message: { x: number; y: number; anim: string }) => {
        this.dispatcher.dispatch(new PlayerUpdateCommand(), {
          client,
          x: message.x,
          y: message.y,
          anim: message.anim,
        })
      }
    )
  }

  onJoin(client: Client, options: any) {
    this.state.players.set(client.sessionId, new Player())
    // this.state.players.forEach((value, key) => {
    //   console.log('key =>', key)
    //   console.log('value =>', value.x)
    // })
    // client.send('string', this.state.players)
  }

  onLeave(client: Client, consented: boolean) {
    delete this.state.players[client.sessionId]

    // if (this.state.players.has(client.sessionId)) {
    //   this.state.players.delete(client.sessionId)
    // }
  }

  onDispose() {
    console.log('room', this.roomId, 'disposing...')
  }
}
