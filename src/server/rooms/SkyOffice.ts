import { Room, Client } from 'colyseus'
import { PlayerState, OfficeState } from './schema/OfficeState'

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
    console.log(client.sessionId, 'joined!')
    this.state.playerStates.push(new PlayerState(client.sessionId))
  }

  onLeave(client: Client, consented: boolean) {
    console.log(client.sessionId, 'left!')
  }

  onDispose() {
    console.log('room', this.roomId, 'disposing...')
  }
}
