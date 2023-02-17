import Phaser from 'phaser'
import MyPlayer from './MyPlayer'
import { PlayerBehavior } from '../../../types/PlayerBehavior'
import Item from '../items/Item'
import { NavKeys } from '../../../types/KeyboardState'
export default class PlayerSelector extends Phaser.GameObjects.Zone {
  selectedItem?: Item

  constructor(scene: Phaser.Scene, x: number, y: number, width: number, height: number) {
    super(scene, x, y, width, height)

    scene.physics.add.existing(this)
  }

  update(player: MyPlayer, cursors: NavKeys, groundLayer?: Phaser.Tilemaps.TilemapLayer) {
    if (!cursors) {
      return
    }

    // no need to update player selection while sitting
    if (player.playerBehavior === PlayerBehavior.SITTING) {
      return
    }

    // update player selection box position so that it's always in front of the player
    const { x, y } = player
    let isTouchLeft = false
    let isTouchRight = false
    let isTouchUp = false
    let isTouchDown = false

    if (groundLayer && player.moveToTarget) {
      const playerVec = groundLayer.worldToTileXY(player.x, player.y)
      const pos = groundLayer.tileToWorldXY(playerVec.x, playerVec.y)
      pos.x += groundLayer.tilemap.tileWidth * 0.5
      pos.y += groundLayer.tilemap.tileHeight * 0.5

      isTouchLeft = pos.x > player.moveToTarget.x
      isTouchRight = pos.x < player.moveToTarget.x
      isTouchUp = pos.y > player.moveToTarget.y
      isTouchDown = pos.y < player.moveToTarget.y
    }

    if (cursors.left?.isDown || cursors.A?.isDown || isTouchLeft) {
      this.setPosition(x - 32, y)
    } else if (cursors.right?.isDown || cursors.D?.isDown || isTouchRight) {
      this.setPosition(x + 32, y)
    } else if (cursors.up?.isDown || cursors.W?.isDown || isTouchUp) {
      this.setPosition(x, y - 32)
    } else if (cursors.down?.isDown || cursors.S?.isDown || isTouchDown) {
      this.setPosition(x, y + 32)
    }

    // while currently selecting an item,
    // if the selector and selection item stop overlapping, clear the dialog box and selected item
    if (this.selectedItem) {
      if (!this.scene.physics.overlap(this, this.selectedItem)) {
        this.selectedItem.clearDialogBox()
        this.selectedItem = undefined
      }
    }
  }
}
