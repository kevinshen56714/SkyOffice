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
    if (!cursors) {
      return
    }
    const speed = 200
    if (cursors.left?.isDown) {
      this.play('player_run_left', true)
      this.setVelocity(-speed, 0)
    } else if (cursors.right?.isDown) {
      this.play('player_run_right', true)
      this.setVelocity(speed, 0)
    } else if (cursors.up?.isDown) {
      this.play('player_run_up', true)
      this.setVelocity(0, -speed)
    } else if (cursors.down?.isDown) {
      this.play('player_run_down', true)
      this.setVelocity(0, speed)
    } else {
      const parts = this.anims.currentAnim.key.split('_')
      parts[1] = 'idle'
      this.play(parts.join('_'), true)
      this.setVelocity(0, 0)
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
