import Phaser from 'phaser'
import Player from './Player'
import { sittingShiftData } from './Player'

export default class OtherPlayer extends Player {
  private targetPosition: [number, number]
  private lastUpdateTimestamp?: number

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    id: string,
    frame?: string | number
  ) {
    super(scene, x, y, texture, id, frame)
    this.targetPosition = [x, y]
  }

  updateOtherPlayer(field: string, value: number | string) {
    switch (field) {
      case 'x':
        if (typeof value === 'number') {
          this.targetPosition[0] = value
        }
        break

      case 'y':
        if (typeof value === 'number') {
          this.targetPosition[1] = value
        }
        break

      case 'anim':
        if (typeof value === 'string') {
          this.anims.play(value, true)
        }
        break
    }
  }

  /** preUpdate is called every frame for every game object. */
  preUpdate(t: number, dt: number) {
    super.preUpdate(t, dt)

    // if Phaser has not updated the canvas (when the game tab is not active) for more than 1 sec
    // directly snap player to their current locations
    if (this.lastUpdateTimestamp && t - this.lastUpdateTimestamp > 1000) {
      this.lastUpdateTimestamp = t
      this.x = this.targetPosition[0]
      this.y = this.targetPosition[1]
      return
    }

    this.lastUpdateTimestamp = t
    this.setDepth(this.y) // change player.depth based on player.y
    const animParts = this.anims.currentAnim.key.split('_')
    const animState = animParts[1]
    if (animState === 'sit') {
      const animDir = animParts[2]
      const sittingShift = sittingShiftData[animDir]
      if (sittingShift) {
        // set hardcoded depth (differs between directions) if player sits down
        this.setDepth(this.depth + sittingShiftData[animDir][2])
      }
    }

    const speed = 200 // speed is in unit of pixels per second
    const delta = (speed / 1000) * dt // minimum distance that a player can move in a frame (dt is in unit of ms)
    let dx = this.targetPosition[0] - this.x
    let dy = this.targetPosition[1] - this.y

    // if the player is close enough to the target position, directly snap the player to that position
    if (Math.abs(dx) < delta) {
      this.x = this.targetPosition[0]
      dx = 0
    }
    if (Math.abs(dy) < delta) {
      this.y = this.targetPosition[1]
      dy = 0
    }

    // if the player is still far from target position, impose a constant velocity towards it
    let vx = 0
    let vy = 0
    if (dx > 0) vx += speed
    else if (dx < 0) vx -= speed
    if (dy > 0) vy += speed
    else if (dy < 0) vy -= speed

    this.setVelocity(vx, vy)
    this.body.velocity.setLength(speed)
  }
}

declare global {
  namespace Phaser.GameObjects {
    interface GameObjectFactory {
      otherPlayer(
        x: number,
        y: number,
        texture: string,
        id: string,
        frame?: string | number
      ): OtherPlayer
    }
  }
}

Phaser.GameObjects.GameObjectFactory.register(
  'otherPlayer',
  function (
    this: Phaser.GameObjects.GameObjectFactory,
    x: number,
    y: number,
    texture: string,
    id: string,
    frame?: string | number
  ) {
    const sprite = new OtherPlayer(this.scene, x, y, texture, id, frame)

    this.displayList.add(sprite)
    this.updateList.add(sprite)

    this.scene.physics.world.enableBody(sprite, Phaser.Physics.Arcade.DYNAMIC_BODY)

    return sprite
  }
)
