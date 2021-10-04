import Phaser from 'phaser'
import { PlayerBehavior } from '../../../types/PlayerBehavior'
import { phaserEvents, Event } from '../events/EventCenter'
/**
 * shifting distance for sitting animation
 * format: direction: [xShift, yShift, depthShift]
 */
export const sittingShiftData = {
  up: [0, 3, -10],
  down: [0, 3, 1],
  left: [0, -8, 10],
  right: [0, -8, 10],
}

export default class Player extends Phaser.Physics.Arcade.Sprite {
  playerId: string
  playerBehavior = PlayerBehavior.IDLE
  readyToConnect = false
  playerName: Phaser.GameObjects.Text
  playerNameContainer: Phaser.GameObjects.Container

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    id: string,
    frame?: string | number
  ) {
    super(scene, x, y, texture, frame)

    this.playerId = id
    this.setDepth(this.y)
    this.playerNameContainer = this.scene.add.container(this.x, this.y - 30).setDepth(10000)

    this.playerName = this.scene.add
      .text(0, 0, '')
      .setFontFamily('Arial')
      .setFontSize(12)
      .setColor('#000000')
      .setOrigin(0.5)

    this.playerNameContainer.add(this.playerName)
    this.scene.physics.world.enable(this.playerNameContainer)
    const playNameContainerBody = this.playerNameContainer.body as Phaser.Physics.Arcade.Body
    const collisionScale = [0.5, 0.2]
    playNameContainerBody
      .setSize(this.width * collisionScale[0], this.height * collisionScale[1])
      .setOffset(-8, this.height * (1 - collisionScale[1]) + 6)
  }

  setPlayerName(name: string) {
    this.playerName.setText(name)
    phaserEvents.emit(Event.MY_PLAYER_NAME_CHANGE, name)
  }
}
