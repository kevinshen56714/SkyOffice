import Phaser from 'phaser'
import PlayerSelector from './PlayerSelector'

export enum PlayerState {
  IDLE,
  SITTING,
}

/**
 * shifting distance for sitting animation
 * format: direction: [xShift, yShift, depthShift]
 */
const sittingShiftData = {
  up: [0, 3, -1],
  down: [0, 3, 1],
  left: [0, -8, 1],
  right: [0, -8, 1],
}

declare global {
  namespace Phaser.GameObjects {
    interface GameObjectFactory {
      player(x: number, y: number, texture: string, frame?: string | number): Player
    }
  }
}

export default class Player extends Phaser.Physics.Arcade.Sprite {
  public keyE!: Phaser.Input.Keyboard.Key

  private _playerState = PlayerState.IDLE
  set playerState(playerState: PlayerState) {
    this._playerState = playerState
  }
  get playerState() {
    return this._playerState
  }

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string, frame?: string | number) {
    super(scene, x, y, texture, frame)

    this.anims.play('player_idle_down', true)

    // maybe we can have a dedicated method for adding keys if more keys are needed in the future
    this.keyE = this.scene.input.keyboard.addKey('E')
  }

  update(playerSelector: PlayerSelector, cursors: Phaser.Types.Input.Keyboard.CursorKeys) {
    if (!cursors) return

    const item = playerSelector.selectedItem

    switch (this.playerState) {
      case PlayerState.IDLE:
        // if press E in front of selected item (chair)
        if (Phaser.Input.Keyboard.JustDown(this.keyE) && item) {
          /**
           * move player to the chair and play sit animation
           * a delay is called to wait for player movement (from previous velocity) to end
           * as the player tends to move one more frame before sitting down causing player
           * not sitting at the center of the chair
           */
          this.scene.time.addEvent({
            delay: 10,
            callback: () => {
              this.setVelocity(0, 0)
              this.setPosition(
                item.x + sittingShiftData[item.itemDirection][0],
                item.y + sittingShiftData[item.itemDirection][1]
              ).setDepth(item.depth + sittingShiftData[item.itemDirection][2])
              this.play(`player_sit_${item.itemDirection}`, true)
              playerSelector.setPosition(0, 0)
            },
            loop: false,
          })
          // set up new dialog as player sits down
          item.clearDialogBox()
          item.setDialogBox('Press E to leave', 95)
          this.playerState = PlayerState.SITTING
          return
        }

        const speed = 200
        let vx = 0
        let vy = 0
        if (cursors.left?.isDown) vx -= speed
        if (cursors.right?.isDown) vx += speed
        if (cursors.up?.isDown) vy -= speed
        if (cursors.down?.isDown) vy += speed
        this.setVelocity(vx, vy)
        this.body.velocity.setLength(speed)

        // Update animation according to velocity.
        if (vx > 0) {
          this.play('player_run_right', true)
        } else if (vx < 0) {
          this.play('player_run_left', true)
        } else if (vy > 0) {
          this.play('player_run_down', true)
          this.setDepth(this.y) //Changes player.depth if player.y changes
        } else if (vy < 0) {
          this.play('player_run_up', true)
          this.setDepth(this.y) //Changes player.depth if player.y changes
        } else {
          const parts = this.anims.currentAnim.key.split('_')
          parts[1] = 'idle'
          this.play(parts.join('_'), true)
        }
        break

      case PlayerState.SITTING:
        // back to idle if player press E while sitting
        if (Phaser.Input.Keyboard.JustDown(this.keyE)) {
          const parts = this.anims.currentAnim.key.split('_')
          parts[1] = 'idle'
          this.play(parts.join('_'), true)
          this.playerState = PlayerState.IDLE
          playerSelector.setPosition(this.x, this.y)
          playerSelector.update(this, cursors)
        }
        break
    }
  }
}

Phaser.GameObjects.GameObjectFactory.register(
  'player',
  function (
    this: Phaser.GameObjects.GameObjectFactory,
    x: number,
    y: number,
    texture: string,
    frame?: string | number
  ) {
    const sprite = new Player(this.scene, x, y, texture, frame)

    this.displayList.add(sprite)
    this.updateList.add(sprite)

    this.scene.physics.world.enableBody(sprite, Phaser.Physics.Arcade.DYNAMIC_BODY)

    const collisionScale = [0.5, 0.2]
    sprite.body
      .setSize(sprite.width * collisionScale[0], sprite.height * collisionScale[1])
      .setOffset(
        sprite.width * (1 - collisionScale[0]) * 0.5,
        sprite.height * (1 - collisionScale[1])
      )

    return sprite
  }
)
