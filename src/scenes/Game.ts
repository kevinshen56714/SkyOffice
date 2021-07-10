import Phaser from 'phaser'
import { debugDraw } from '../utils/debug'
import { createCharacterAnims } from '../anims/CharacterAnims'

import '../characters/Player'

export default class Game extends Phaser.Scene {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private player!: Phaser.Physics.Arcade.Sprite

  constructor() {
    super('game')
  }

  preload() {
    this.cursors = this.input.keyboard.createCursorKeys()
  }

  create() {
    createCharacterAnims(this.anims)

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

    // debugDraw(groundLayer, this)

    this.player = this.add.player(705, 500, 'player')

    this.cameras.main.zoom = 1.5
    this.cameras.main.startFollow(this.player, true)

    this.physics.add.collider(this.player, groundLayer)
  }

  update(t: number, dt: number) {
    if (this.player) {
      this.player.update(this.cursors)
    }
  }
}
