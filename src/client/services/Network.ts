import { Client, Room } from 'colyseus.js'
import Phaser from 'phaser'
import { IOfficeState, IPlayer } from '../../types/IOfficeState'
import { Message } from '../../types/Messages'

enum Event {
  PLAYERJOINED = 'player-joined',
  PLAYERUPDATED = 'player-updated',
  PLAYERLEFT = 'player-left',
}

export default class Network {
  private client: Client
  private room?: Room<IOfficeState>
  private events = new Phaser.Events.EventEmitter()

  private _mySessionId!: string
  set mySessionId(id: string) {
    this._mySessionId = id
  }
  get mySessionId() {
    return this._mySessionId
  }

  constructor() {
    const protocol = window.location.protocol.replace('http', 'ws')
    const endpoint =
      process.env.NODE_ENV === 'production'
        ? `wss://sky-office.herokuapp.com`
        : `${protocol}//${window.location.hostname}:2567`
    this.client = new Client(endpoint)
  }

  async join() {
    this.room = await this.client.joinOrCreate('skyoffice')
    this.mySessionId = this.room.sessionId

    // new instance added to the players MapSchema
    this.room.state.players.onAdd = (player: IPlayer, key: string) => {
      if (key === this.mySessionId) return

      this.events.emit(Event.PLAYERJOINED, player, key)

      // track changes on every child object inside the players MapSchema
      player.onChange = (changes) => {
        changes.forEach((change) => {
          const { field, value } = change
          this.events.emit(Event.PLAYERUPDATED, field, value, key)
        })
      }
    }

    // an instance removed from the players MapSchema
    this.room.state.players.onRemove = (player: IPlayer, key: string) => {
      this.events.emit(Event.PLAYERLEFT, key)
    }
  }

  // method to register event listener and call back function when a player joined
  onPlayerJoined(callback: (Player: IPlayer, key: string) => void, context?: any) {
    this.events.on(Event.PLAYERJOINED, callback, context)
  }

  // method to register event listener and call back function when a player left
  onPlayerLeft(callback: (key: string) => void, context?: any) {
    this.events.on(Event.PLAYERLEFT, callback, context)
  }

  // method to register event listener and call back function when a player updated
  onPlayerUpdated(
    callback: (field: string, value: number | string, key: string) => void,
    context?: any
  ) {
    this.events.on(Event.PLAYERUPDATED, callback, context)
  }

  // method to send player updates to Colyseus server
  updatePlayer(currentX: number, currentY: number, currentAnim: string) {
    if (!this.room) return
    this.room.send(Message.UPDATEPLAYER, { x: currentX, y: currentY, anim: currentAnim })
  }
}
