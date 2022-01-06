import Phaser from 'phaser'
import { RoomType } from '../../../types/Rooms'
import MyPlayer from '../characters/MyPlayer'

export default class TeleportZone extends Phaser.GameObjects.Zone {
  teleportTo!: RoomType
  roomId?: string

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    teleportTo: RoomType
  ) {
    super(scene, x, y, width, height)

    this.teleportTo = teleportTo
  }

  update(player: MyPlayer, cursors: Phaser.Types.Input.Keyboard.CursorKeys) {
    if (!cursors) {
      return
    }
  }
}
