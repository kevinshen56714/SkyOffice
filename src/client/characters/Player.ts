import Phaser from 'phaser'
import { PlayerBehavior } from '../../types/PlayerBehavior'

export const sittingShiftData = {
  up: [0, 3, -10],
  down: [0, 3, 1],
  left: [0, -8, 10],
  right: [0, -8, 10],
}

export default class Player extends Phaser.Physics.Arcade.Sprite {
  _playerId!: string
  set playerId(id: string) {
    this._playerId = id
  }
  get playerId() {
    return this._playerId
  }

  _playerBehavior = PlayerBehavior.IDLE
  set playerBehavior(playerBehavior: PlayerBehavior) {
    this._playerBehavior = playerBehavior
  }
  get playerBehavior() {
    return this._playerBehavior
  }

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string, frame?: string | number) {
    super(scene, x, y, texture, frame)

    this.setDepth(this.y)
  }
}
