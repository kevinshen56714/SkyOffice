import Phaser from 'phaser'

export default class Game extends Phaser.Scene {
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

    map.createLayer('Ground', ground)
    map.createLayer('Obj_layer1', office_obj)
    map.createLayer('Obj_layer2', office_obj)
    map.createLayer('Obj_layer3', office_obj)
    this.cameras.main.zoom = 1.5
  }
}
