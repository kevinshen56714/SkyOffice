import Phaser from 'phaser'

export default class Preloader extends Phaser.Scene {
  constructor() {
    super('preloader')
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

    this.load.spritesheet('office', 'assets/items/Modern_Office_Black_Shadow.png', {
      frameWidth: 32,
      frameHeight: 32,
    })

    this.load.spritesheet('generic', 'assets/items/Generic.png', {
      frameWidth: 32,
      frameHeight: 32,
    })

    this.load.spritesheet('player', 'assets/character/adam.png', {
      frameWidth: 32,
      frameHeight: 48,
    })
  }

  create() {
    this.scene.start('game')
  }
}
