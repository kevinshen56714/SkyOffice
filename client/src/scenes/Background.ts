import Phaser from 'phaser'
import { BackgroundMode } from '../../../types/BackgroundMode'

export default class Background extends Phaser.Scene {
  private cloud!: Phaser.Physics.Arcade.Group
  private cloudKey!: string
  private backdropKey!: string

  constructor() {
    super('background')
  }

  create(data: { backgroundMode: BackgroundMode }) {
    const sceneHeight = this.cameras.main.height
    const sceneWidth = this.cameras.main.width

    // set texture of images based on the background mode
    if (data.backgroundMode === BackgroundMode.DAY) {
      this.backdropKey = 'backdrop_day'
      this.cloudKey = 'cloud_day'
      this.cameras.main.setBackgroundColor('#c6eefc')
    } else {
      this.backdropKey = 'backdrop_night'
      this.cloudKey = 'cloud_night'
      this.cameras.main.setBackgroundColor('#2c4464')
    }

    // Add backdrop image
    const backdropImage = this.add.image(sceneWidth / 2, sceneHeight / 2, this.backdropKey)
    const scale = Math.max(sceneWidth / backdropImage.width, sceneHeight / backdropImage.height)
    backdropImage.setScale(scale).setScrollFactor(0)

    // Add sun or moon image
    const sunMoonImage = this.add.image(sceneWidth / 2, sceneHeight / 2, 'sun_moon')
    const scale2 = Math.max(sceneWidth / sunMoonImage.width, sceneHeight / sunMoonImage.height)
    sunMoonImage.setScale(scale2).setScrollFactor(0)

    // Add 24 clouds at random positions and with random speeds
    const frames = this.textures.get(this.cloudKey).getFrameNames()
    this.cloud = this.physics.add.group()
    for (let i = 0; i < 24; i++) {
      const x = Phaser.Math.RND.between(-sceneWidth * 0.5, sceneWidth * 1.5)
      const y = Phaser.Math.RND.between(sceneHeight * 0.2, sceneHeight * 0.8)
      const velocity = Phaser.Math.RND.between(15, 30)

      this.cloud
        .get(x, y, this.cloudKey, frames[i % 6])
        .setScale(3)
        .setVelocity(velocity, 0)
    }
  }

  update(t: number, dt: number) {
    this.physics.world.wrap(this.cloud, 500)
  }
}
