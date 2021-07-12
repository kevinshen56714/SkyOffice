import Phaser from 'phaser'

declare global {
  namespace Phaser.GameObjects {
    interface GameObjectFactory {
      player(x: number, y: number, texture: string, frame?: string | number): Player
    }
  }
}

export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number, texture: string, frame?: string | number) {
    super(scene, x, y, texture, frame)

    this.anims.play('player_idle_down', true)
  }

  update(cursors: Phaser.Types.Input.Keyboard.CursorKeys) {
    if (!cursors) return

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
    } else if (vy < 0) {
      this.play('player_run_up', true)
    } else {
      const parts = this.anims.currentAnim.key.split('_')
      parts[1] = 'idle'
      this.play(parts.join('_'), true)
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
    var sprite = new Player(this.scene, x, y, texture, frame)

    this.displayList.add(sprite)
    this.updateList.add(sprite)

    this.scene.physics.world.enableBody(sprite, Phaser.Physics.Arcade.DYNAMIC_BODY)

    const bodyScale = [0.4, 0.2]
    sprite.body.setSize(sprite.width * bodyScale[0], sprite.height * bodyScale[1])
    sprite.body.setOffset(16 * (1 - bodyScale[0]), 48 * (1 - bodyScale[1]))

    return sprite
  }
)
