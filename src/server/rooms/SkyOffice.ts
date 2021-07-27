import { Room, Client } from 'colyseus'
import { Player, OfficeState } from './schema/OfficeState'

export class SkyOffice extends Room<OfficeState> {
  onCreate(options: any) {
    this.setState(new OfficeState())

    this.onMessage('type', (client, message) => {
      //
      // handle "type" message
      //
    })
  }

  onJoin(client: Client, options: any) {
    this.state.players.set(client.sessionId, new Player())
    // this.state.players.forEach((value, key) => {
    //   console.log('key =>', key)
    //   console.log('value =>', value.x)
    // })
    // client.send('string', this.state.players)
  }

  async onLeave(client: Client, consented: boolean) {
    // flag client as inactive for other users
    // this.state.players[client.sessionId].connected = false

    // try {
    //   if (consented) {
    //     throw new Error('consented leave')
    //   }

    //   // allow disconnected client to reconnect into this room until 20 seconds
    //   await this.allowReconnection(client, 20)

    //   // client returned! let's re-activate it.
    //   this.state.players[client.sessionId].connected = true
    // } catch (e) {
    // 20 seconds expired. let's remove the client.
    delete this.state.players[client.sessionId]
    // }

    // if (this.state.players.has(client.sessionId)) {
    //   this.state.players.delete(client.sessionId)
    // }
  }

  onDispose() {
    console.log('room', this.roomId, 'disposing...')
  }
}
