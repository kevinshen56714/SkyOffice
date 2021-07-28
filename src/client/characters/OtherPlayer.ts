import Phaser from 'phaser'
import Player from './Player'
import { sittingShiftData } from './Player'

export default class OtherPlayer extends Player {
  private targetPosition: Array<number>
  private lastUpdateTimestamp?: number

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    id?: string,
    frame?: string | number
  ) {
    super(scene, x, y, texture, frame)
    this.targetPosition = [x, y]

    if (id) this.playerId = id
  }

  updateTargetPosition(field: string, value: number | string) {
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

  // preUpdate is called every frame for every game object
  preUpdate(t: number, dt: number) {
    super.preUpdate(t, dt)

    /**
     * if Phaser has not updated the canvas (when the game tab is not active) for more than 1 sec
     * directly snap players to current location
     */
    if (this.lastUpdateTimestamp && t - this.lastUpdateTimestamp > 1000) {
      this.lastUpdateTimestamp = t
      this.x = this.targetPosition[0]
      this.y = this.targetPosition[1]
      return
    }

    this.lastUpdateTimestamp = t
    this.setDepth(this.y) // change player.depth based on player.y
    const animState = this.anims.currentAnim.key.split('_')[1]
    const animDir = this.anims.currentAnim.key.split('_')[2]
    if (animState == 'sit') {
      this.setDepth(this.depth + sittingShiftData[animDir][2])
    } // set hardcoded depth if player sits down

    const speed = 200 // speed is in unit of pixels per secnod
    const delta = (speed / 1000) * dt // minimum distance that player can move in a frame (dt is in unit of ms)
    var dx = this.targetPosition[0] - this.x
    var dy = this.targetPosition[1] - this.y

    // if player is close enough to the target position, directly snap player to that position
    if (Math.abs(dx) < delta) {
      this.x = this.targetPosition[0]
      dx = 0
    }
    if (Math.abs(dy) < delta) {
      this.y = this.targetPosition[1]
      dy = 0
    }

    // if player is still far from target position, impose a const velocity towards it
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
