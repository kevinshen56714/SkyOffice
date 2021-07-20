import Phaser from 'phaser'
import { debugDraw } from '../utils/debug'
import { createCharacterAnims } from '../anims/CharacterAnims'

import Item from '../items/Item'
import '../characters/Player'
import PlayerSelector from '../characters/PlayerSelector'

export default class Game extends Phaser.Scene {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private player!: Phaser.Physics.Arcade.Sprite
  private upperWalls!: Phaser.Physics.Arcade.StaticGroup
  private items!: Phaser.Physics.Arcade.StaticGroup
  private nonInteractiveItems!: Phaser.Physics.Arcade.StaticGroup
  private nonInteractiveItemsOnCollide!: Phaser.Physics.Arcade.StaticGroup
  private playerSelector!: Phaser.GameObjects.Zone

  constructor() {
    super('game')
  }

  preload() {
    this.cursors = this.input.keyboard.createCursorKeys()
  }

  create() {
    createCharacterAnims(this.anims)

    const map = this.make.tilemap({ key: 'tilemap' })
    const FloorAndGround = map.addTilesetImage('FloorAndGround', 'tiles_wall')

    const groundLayer = map.createLayer('Ground', FloorAndGround)
    groundLayer.setCollisionByProperty({ collides: true })

    // debugDraw(groundLayer, this)

    // import wall objects from Tiled map to Phaser
    this.upperWalls = this.physics.add.staticGroup()
    const upperWallLayer = map.getObjectLayer('Wall')
    upperWallLayer.objects.forEach((wallObj) => {
      const actualX = wallObj.x! + wallObj.width! * 0.5
      const actualY = wallObj.y! - wallObj.height! * 0.5
      this.upperWalls
        .get(
          actualX,
          actualY,
          'tiles_wall',
          wallObj.gid! - map.getTileset('FloorAndGround').firstgid
        )
        .setDepth(actualY)
    })

    // import item objects (currently chairs) from Tiled map to Phaser
    this.items = this.physics.add.staticGroup({
      classType: Item,
    })
    const chairLayer = map.getObjectLayer('Chair')
    chairLayer.objects.forEach((chairObj) => {
      const actualX = chairObj.x! + chairObj.width! * 0.5
      const actualY = chairObj.y! - chairObj.height! * 0.5
      const item = this.items
        .get(actualX, actualY, 'chairs', chairObj.gid! - map.getTileset('chair').firstgid)
        .setDepth(actualY)
      // custom properties[0] is the object direction set from Tiled
      item.itemDirection = chairObj.properties[0].value
    })

    // import all other objects from Tiled map to Phaser
    this.nonInteractiveItems = this.physics.add.staticGroup()
    const objLayer = map.getObjectLayer('Objects')
    objLayer.objects.forEach((obj) => {
      const actualX = obj.x! + obj.width! * 0.5
      const actualY = obj.y! - obj.height! * 0.5
      this.nonInteractiveItems
        .get(
          actualX,
          actualY,
          'office',
          obj.gid! - map.getTileset('Modern_Office_Black_Shadow').firstgid
        )
        .setDepth(actualY)
    })
    const genericLayer = map.getObjectLayer('GenericObjects')
    genericLayer.objects.forEach((obj) => {
      const actualX = obj.x! + obj.width! * 0.5
      const actualY = obj.y! - obj.height! * 0.5
      this.nonInteractiveItems
        .get(actualX, actualY, 'generic', obj.gid! - map.getTileset('Generic').firstgid)
        .setDepth(actualY)
    })

    // import all other objects that are collidable from Tiled map to Phaser
    this.nonInteractiveItemsOnCollide = this.physics.add.staticGroup()
    const objOnCollideLayer = map.getObjectLayer('ObjectsOnCollide')
    objOnCollideLayer.objects.forEach((obj) => {
      const actualX = obj.x! + obj.width! * 0.5
      const actualY = obj.y! - obj.height! * 0.5
      this.nonInteractiveItemsOnCollide
        .get(
          actualX,
          actualY,
          'office',
          obj.gid! - map.getTileset('Modern_Office_Black_Shadow').firstgid
        )
        .setDepth(actualY)
    })
    const genericOnCollideLayer = map.getObjectLayer('GenericObjectsOnCollide')
    genericOnCollideLayer.objects.forEach((obj) => {
      const actualX = obj.x! + obj.width! * 0.5
      const actualY = obj.y! - obj.height! * 0.5
      this.nonInteractiveItemsOnCollide
        .get(actualX, actualY, 'generic', obj.gid! - map.getTileset('Generic').firstgid)
        .setDepth(actualY)
    })

    this.player = this.add.player(705, 500, 'player')

    this.playerSelector = new PlayerSelector(this, 0, 0, 16, 16)

    this.cameras.main.zoom = 1.5
    this.cameras.main.startFollow(this.player, true)

    this.physics.add.collider(this.player, groundLayer)
    this.physics.add.collider(this.player, this.nonInteractiveItemsOnCollide)
    this.physics.add.overlap(
      this.playerSelector,
      this.items,
      this.handleItemSelectorOverlap,
      undefined,
      this
    )
  }

  private handleItemSelectorOverlap(playerSelector, selectionItem) {
    // if the selection has not changed, do nothing
    if (playerSelector.selectedItem === selectionItem) {
      return
    }

    // if selection changes, clear pervious dialog
    if (playerSelector.selectedItem) {
      playerSelector.selectedItem.clearDialogBox()
    }

    // set selected item and set up new dialog
    playerSelector.selectedItem = selectionItem
    selectionItem.setDialogBox('Press E to sit', 80)
  }

  update(t: number, dt: number) {
    if (this.player) {
      this.playerSelector.update(this.player, this.cursors)
      this.player.update(this.playerSelector, this.cursors)
    }
  }
}
