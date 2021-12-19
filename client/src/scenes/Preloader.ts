import Phaser from 'phaser'
import Network from '../services/Network'

enum BackgroundMode {
  DAY,
  NIGHT,
}

export default class Preloader extends Phaser.Scene {
  network!: Network
  private sceneHeight = window.innerHeight
  private sceneWidth = window.innerWidth
  private cloud!: Phaser.Physics.Arcade.Group
  private backdropImage!: Phaser.GameObjects.Image
  private backgroundMode!: BackgroundMode

  constructor() {
    super('preloader')
    const currentHour = new Date().getHours()
    this.backgroundMode =
      currentHour > 6 && currentHour <= 18 ? BackgroundMode.DAY : BackgroundMode.NIGHT
  }

  preload() {
    this.load.tilemapTiledJSON('tilemap', 'assets/map/map.json')

    this.load.spritesheet('tiles_wall', 'assets/map/FloorAndGround.png', {
      frameWidth: 32,
      frameHeight: 32,
    })

    this.load.spritesheet('chairs', 'assets/items/chair.png', {
      frameWidth: 32,
      frameHeight: 64,
    })

    this.load.spritesheet('computers', 'assets/items/computer.png', {
      frameWidth: 96,
      frameHeight: 64,
    })

    this.load.spritesheet('office', 'assets/items/Modern_Office_Black_Shadow.png', {
      frameWidth: 32,
      frameHeight: 32,
    })

    this.load.spritesheet('generic', 'assets/items/Generic.png', {
      frameWidth: 32,
      frameHeight: 32,
    })

    this.load.spritesheet('adam', 'assets/character/adam.png', {
      frameWidth: 32,
      frameHeight: 48,
    })

    this.load.spritesheet('ash', 'assets/character/ash.png', {
      frameWidth: 32,
      frameHeight: 48,
    })

    this.load.spritesheet('lucy', 'assets/character/lucy.png', {
      frameWidth: 32,
      frameHeight: 48,
    })

    this.load.spritesheet('nancy', 'assets/character/nancy.png', {
      frameWidth: 32,
      frameHeight: 48,
    })

    if (this.backgroundMode === BackgroundMode.DAY) {
      // current local time is in the morning
      this.load.atlas(
        'cloud',
        'assets/background/cloud_day.png',
        'assets/background/cloud_day.json'
      )
      this.load.image('backdrop', 'assets/background/backdrop_day.png')
    } else {
      // current local time is in the evening
      this.load.atlas(
        'cloud',
        'assets/background/cloud_night.png',
        'assets/background/cloud_night.json'
      )
      this.load.image('backdrop', 'assets/background/backdrop_night.png')
    }
    this.load.image('sun_moon', 'assets/background/sun_moon.png')
  }

  init() {
    this.network = new Network()
  }

  create() {
    this.backdropImage = this.add.image(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      'backdrop'
    )
    const scale = Math.max(
      this.sceneWidth / this.backdropImage.width,
      this.sceneHeight / this.backdropImage.height
    )
    this.backdropImage.setScale(scale).setScrollFactor(0)
    if (this.backgroundMode === BackgroundMode.NIGHT) {
      this.cameras.main.setBackgroundColor('#2c4464')
    }

    const image = this.add.image(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      'sun_moon'
    )
    const scale2 = Math.max(this.sceneWidth / image.width, this.sceneHeight / image.height)
    image.setScale(scale2).setScrollFactor(0)

    this.cloud = this.physics.add.group()
    for (let i = 0; i < 24; i++) {
      const x = Phaser.Math.RND.between(-this.sceneWidth * 0.5, this.sceneWidth * 1.5)
      const y = Phaser.Math.RND.between(this.sceneHeight * 0.2, this.sceneHeight * 0.8)
      const velocity = Phaser.Math.RND.between(15, 30)

      this.cloud
        .get(x, y, 'cloud', `cloud${(i % 6) + 1}.png`)
        .setScale(3)
        .setVelocity(velocity, 0)
    }
  }

  update(t: number, dt: number) {
    this.physics.world.wrap(this.cloud, 500)
  }

  startRoom() {
    if (this.backgroundMode === BackgroundMode.DAY) {
      this.backdropImage.destroy()
    }
    this.scene.launch('game', {
      network: this.network,
    })
  }
}
