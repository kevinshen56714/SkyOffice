import { Client, Room } from 'colyseus.js'
import Phaser from 'phaser'
import { IOfficeState, IPlayer } from '../../types/IOfficeState'

export default class Network {
  private client: Client
  private room?: Room<IOfficeState>
  private events: Phaser.Events.EventEmitter

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
    this.events = new Phaser.Events.EventEmitter()
  }

  async join() {
    this.room = await this.client.joinOrCreate('skyoffice')
    this.mySessionId = this.room.sessionId

    // this.room.state.players.onChange = (player, key) => {
    //   console.log(player, 'have changes at', key)
    // }

    this.room.state.players.onAdd = (player: IPlayer, key: string) => {
      if (key === this.mySessionId) return

      this.events.emit('player-joined', player, key)

      //   player.onChange = function (changes) {
      //     changes.forEach((change) => {
      //       console.log('onChange')
      //       console.log(change.field)
      //       console.log(change.value)
      //       //   console.log(change.previousValue)
      //     })
      //   }
    }

    this.room.state.players.onRemove = (player: IPlayer, key: string) => {
      this.events.emit('player-left', key)
    }
  }

  onPlayerJoined(callback: (Player: IPlayer, key: string) => void, context?: any) {
    this.events.on('player-joined', callback, context)
  }

  onPlayerLeft(callback: (key: string) => void, context?: any) {
    this.events.on('player-left', callback, context)
  }
}
