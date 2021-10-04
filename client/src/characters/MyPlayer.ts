import Phaser from 'phaser'
import PlayerSelector from './PlayerSelector'
import { PlayerBehavior } from '../../../types/PlayerBehavior'
import { sittingShiftData } from './Player'
import Player from './Player'
import Network from '../services/Network'

export default class MyPlayer extends Player {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    id: string,
    frame?: string | number
  ) {
    super(scene, x, y, texture, id, frame)

    this.anims.play('player_idle_down', true)
  }

  update(
    playerSelector: PlayerSelector,
    cursors: Phaser.Types.Input.Keyboard.CursorKeys,
    keyE: Phaser.Input.Keyboard.Key,
    network: Network
  ) {
    if (!cursors) return

    const item = playerSelector.selectedItem

    switch (this.playerBehavior) {
      case PlayerBehavior.IDLE:
        // if press E in front of selected item (chair)
        if (Phaser.Input.Keyboard.JustDown(keyE) && item) {
          /**
           * move player to the chair and play sit animation
           * a delay is called to wait for player movement (from previous velocity) to end
           * as the player tends to move one more frame before sitting down causing player
           * not sitting at the center of the chair
           */
          this.scene.time.addEvent({
            delay: 10,
            callback: () => {
              // update character velocity and position
              this.setVelocity(0, 0)
              this.setPosition(
                item.x + sittingShiftData[item.itemDirection][0],
                item.y + sittingShiftData[item.itemDirection][1]
              ).setDepth(item.depth + sittingShiftData[item.itemDirection][2])
              // also update playerNameContainer velocity and position
              if (this.playerNameContainer.body instanceof Phaser.Physics.Arcade.Body) {
                this.playerNameContainer.body.setVelocity(0, 0)
                this.playerNameContainer.setPosition(
                  item.x + sittingShiftData[item.itemDirection][0],
                  item.y + sittingShiftData[item.itemDirection][1] - 30
                )
              }
              this.play(`player_sit_${item.itemDirection}`, true)
              playerSelector.setPosition(0, 0)
              // send new location and anim to server
              network.updatePlayer(this.x, this.y, this.anims.currentAnim.key)
            },
            loop: false,
          })
          // set up new dialog as player sits down
          item.clearDialogBox()
          item.setDialogBox('Press E to leave', 95)
          this.playerBehavior = PlayerBehavior.SITTING
          return
        }

        const speed = 200
        let vx = 0
        let vy = 0
        if (cursors.left?.isDown) vx -= speed
        if (cursors.right?.isDown) vx += speed
        if (cursors.up?.isDown) {
          vy -= speed
          this.setDepth(this.y) //change player.depth if player.y changes
        }
        if (cursors.down?.isDown) {
          vy += speed
          this.setDepth(this.y) //change player.depth if player.y changes
        }
        // update character velocity
        this.setVelocity(vx, vy)
        this.body.velocity.setLength(speed)
        // also update playerNameContainer velocity
        if (this.playerNameContainer.body instanceof Phaser.Physics.Arcade.Body) {
          this.playerNameContainer.body.setVelocity(vx, vy)
          this.playerNameContainer.body.velocity.setLength(speed)
        }

        // update animation according to velocity and send new location and anim to server
        if (vx !== 0 || vy !== 0) network.updatePlayer(this.x, this.y, this.anims.currentAnim.key)
        if (vx > 0) {
          this.play('player_run_right', true)
        } else if (vx < 0) {
          this.play('player_run_left', true)
        } else if (vy > 0) {
          this.play('player_run_down', true)
        } else if (vy < 0) {
          this.play('player_run_up', true)
        } else {
          const parts = this.anims.currentAnim.key.split('_')
          parts[1] = 'idle'
          const newAnim = parts.join('_')
          // this prevents idle animation keeps getting called
          if (this.anims.currentAnim.key !== newAnim) {
            this.play(parts.join('_'), true)
            // send new location and anim to server
            network.updatePlayer(this.x, this.y, this.anims.currentAnim.key)
          }
        }
        break

      case PlayerBehavior.SITTING:
        // back to idle if player press E while sitting
        if (Phaser.Input.Keyboard.JustDown(keyE)) {
          const parts = this.anims.currentAnim.key.split('_')
          parts[1] = 'idle'
          this.play(parts.join('_'), true)
          this.playerBehavior = PlayerBehavior.IDLE
          playerSelector.setPosition(this.x, this.y)
          playerSelector.update(this, cursors)
          network.updatePlayer(this.x, this.y, this.anims.currentAnim.key)
        }
        break
    }
  }
}

declare global {
  namespace Phaser.GameObjects {
    interface GameObjectFactory {
      myPlayer(x: number, y: number, texture: string, id: string, frame?: string | number): MyPlayer
    }
  }
}

Phaser.GameObjects.GameObjectFactory.register(
  'myPlayer',
  function (
    this: Phaser.GameObjects.GameObjectFactory,
    x: number,
    y: number,
    texture: string,
    id: string,
    frame?: string | number
  ) {
    const sprite = new MyPlayer(this.scene, x, y, texture, id, frame)

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
