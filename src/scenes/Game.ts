import Phaser from 'phaser'

export default class Game extends Phaser.Scene {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private player!: Phaser.Physics.Arcade.Sprite
  private playerDirection!: string

  constructor() {
    super('game')
  }

  preload() {
    this.load.image('tiles1', 'assets/map/Room_Builder_Office.png')
    this.load.image('tiles2', 'assets/map/Room_Builder_Floors.png')
    this.load.image('tiles3', 'assets/map/Room_Builder_Walls.png')
    this.load.image('tiles4', 'assets/map/Generic.png')
    this.load.image('tiles5', 'assets/map/Modern_Office_Black_Shadow.png')
    this.load.image('tiles6', 'assets/map/Classroom_and_library.png')
    this.load.tilemapTiledJSON('tilemap', 'assets/map/map.json')

    this.load.atlas('player', 'assets/character/adam.png', 'assets/character/adam.json')

    this.cursors = this.input.keyboard.createCursorKeys()
  }

  create() {
    const map = this.make.tilemap({ key: 'tilemap' })
    const ground1 = map.addTilesetImage('Room_Builder_Office', 'tiles1')
    const ground2 = map.addTilesetImage('Room_Builder_Floors', 'tiles2')
    const ground3 = map.addTilesetImage('Room_Builder_Walls', 'tiles3')
    const obj1 = map.addTilesetImage('Generic', 'tiles4')
    const obj2 = map.addTilesetImage('Modern_Office_Black_Shadow', 'tiles5')
    const obj3 = map.addTilesetImage('Classroom_and_library', 'tiles6')

    const ground = [ground1, ground2, ground3, obj1]
    const office_obj = [obj1, obj2, obj3]

    const groundLayer = map.createLayer('Ground', ground)
    map.createLayer('Obj_layer1', office_obj)
    map.createLayer('Obj_layer2', office_obj)
    map.createLayer('Obj_layer3', office_obj)

    groundLayer.setCollisionByProperty({ collides: true })

    const debugGraphics = this.add.graphics().setAlpha(0.7)
    groundLayer.renderDebug(debugGraphics, {
      tileColor: null,
      collidingTileColor: new Phaser.Display.Color(243, 234, 48, 255),
      faceColor: new Phaser.Display.Color(40, 39, 37, 255),
    })

    this.player = this.physics.add.sprite(
      this.sys.canvas.width * 0.35,
      this.sys.canvas.height * 1,
      'player',
      'Adam_idle_anim_19.png'
    )
    this.playerDirection = 'down'

    const animsFrameRate = 15

    this.anims.create({
      key: 'player_idle_right',
      frames: this.anims.generateFrameNames('player', {
        start: 1,
        end: 6,
        prefix: 'Adam_idle_anim_',
        suffix: '.png',
      }),
      repeat: -1,
      frameRate: animsFrameRate * 0.6,
    })

    this.anims.create({
      key: 'player_idle_up',
      frames: this.anims.generateFrameNames('player', {
        start: 7,
        end: 12,
        prefix: 'Adam_idle_anim_',
        suffix: '.png',
      }),
      repeat: -1,
      frameRate: animsFrameRate * 0.6,
    })

    this.anims.create({
      key: 'player_idle_left',
      frames: this.anims.generateFrameNames('player', {
        start: 13,
        end: 18,
        prefix: 'Adam_idle_anim_',
        suffix: '.png',
      }),
      repeat: -1,
      frameRate: animsFrameRate * 0.6,
    })

    this.anims.create({
      key: 'player_idle_down',
      frames: this.anims.generateFrameNames('player', {
        start: 19,
        end: 24,
        prefix: 'Adam_idle_anim_',
        suffix: '.png',
      }),
      repeat: -1,
      frameRate: animsFrameRate * 0.6,
    })

    this.anims.create({
      key: 'player_run_right',
      frames: this.anims.generateFrameNames('player', {
        start: 1,
        end: 6,
        prefix: 'Adam_run_',
        suffix: '.png',
      }),
      repeat: -1,
      frameRate: animsFrameRate,
    })

    this.anims.create({
      key: 'player_run_up',
      frames: this.anims.generateFrameNames('player', {
        start: 7,
        end: 12,
        prefix: 'Adam_run_',
        suffix: '.png',
      }),
      repeat: -1,
      frameRate: animsFrameRate,
    })

    this.anims.create({
      key: 'player_run_left',
      frames: this.anims.generateFrameNames('player', {
        start: 13,
        end: 18,
        prefix: 'Adam_run_',
        suffix: '.png',
      }),
      repeat: -1,
      frameRate: animsFrameRate,
    })

    this.anims.create({
      key: 'player_run_down',
      frames: this.anims.generateFrameNames('player', {
        start: 19,
        end: 24,
        prefix: 'Adam_run_',
        suffix: '.png',
      }),
      repeat: -1,
      frameRate: animsFrameRate,
    })

    this.cameras.main.zoom = 1.5
    this.cameras.main.startFollow(this.player)
  }

  update(t: number, dt: number) {
    if (!this.cursors || !this.player) {
      return
    }
    const speed = 200
    if (this.cursors.left?.isDown) {
      this.player.play('player_run_left', true)
      this.player.setVelocity(-speed, 0)
      this.playerDirection = 'left'
    } else if (this.cursors.right?.isDown) {
      this.player.play('player_run_right', true)
      this.player.setVelocity(speed, 0)
      this.playerDirection = 'right'
    } else if (this.cursors.up?.isDown) {
      this.player.play('player_run_up', true)
      this.player.setVelocity(0, -speed)
      this.playerDirection = 'up'
    } else if (this.cursors.down?.isDown) {
      this.player.play('player_run_down', true)
      this.player.setVelocity(0, speed)
      this.playerDirection = 'down'
    } else {
      this.player.setVelocity(0, 0)
      this.player.play(`player_idle_${this.playerDirection}`, true)
    }
  }
}
