import Phaser from 'phaser'

// import { debugDraw } from '../utils/debug'

import Item from '../items/Item'
import Chair from '../items/Chair'
import Computer from '../items/Computer'
import Whiteboard from '../items/Whiteboard'
import '../characters/MyPlayer'
import '../characters/OtherPlayer'
import { PlayerBehavior } from '../../../types/PlayerBehavior'
import Scene, { ISceneData } from './Scene'
import network from '../services/Network'

export default class Office extends Scene {
  constructor() {
    super('office')
  }

  async create(data: ISceneData) {
    this.map = this.make.tilemap({ key: 'tilemap' })
    super.create(data)

    if (data.teleportTo) {
      await network.joinOffice(data.teleportTo)
    } else {
      console.error('Missing office destination')
    }

    const FloorAndGround = this.map.addTilesetImage('FloorAndGround', 'tiles_wall')
    const groundLayer = this.map
      .createLayer('Ground', FloorAndGround)
      .setDepth(-10000)
      .setCollisionByProperty({ collides: true })

    // debugDraw(groundLayer, this)

    // import chair objects from Tiled map to Phaser
    const chairs = this.physics.add.staticGroup({ classType: Chair })
    const chairLayer = this.map.getObjectLayer('Chair')
    chairLayer.objects.forEach((chairObj) => {
      const item = this.addObjectFromTiled(chairs, chairObj, 'chairs', 'chair') as Chair
      // custom properties[0] is the object direction specified in Tiled
      item.itemDirection = chairObj.properties[0].value
    })

    // import computers objects from Tiled map to Phaser
    const computers = this.physics.add.staticGroup({ classType: Computer })
    const computerLayer = this.map.getObjectLayer('Computer')
    computerLayer.objects.forEach((obj, i) => {
      const item = this.addObjectFromTiled(computers, obj, 'computers', 'computer') as Computer
      item.setDepth(item.y + item.height * 0.27)
      const id = `${i}`
      item.id = id
      this.computerMap.set(id, item)
    })

    // import whiteboards objects from Tiled map to Phaser
    const whiteboards = this.physics.add.staticGroup({ classType: Whiteboard })
    const whiteboardLayer = this.map.getObjectLayer('Whiteboard')
    whiteboardLayer.objects.forEach((obj, i) => {
      const item = this.addObjectFromTiled(
        whiteboards,
        obj,
        'whiteboards',
        'whiteboard'
      ) as Whiteboard
      const id = `${i}`
      item.id = id
      this.whiteboardMap.set(id, item)
    })

    // import other objects from Tiled map to Phaser
    this.addGroupFromTiled('Wall', 'tiles_wall', 'FloorAndGround', false)
    this.addGroupFromTiled('Objects', 'office', 'Modern_Office_Black_Shadow', false)
    this.addGroupFromTiled('ObjectsOnCollide', 'office', 'Modern_Office_Black_Shadow', true)
    this.addGroupFromTiled('GenericObjects', 'generic', 'Generic', false)
    this.addGroupFromTiled('GenericObjectsOnCollide', 'generic', 'Generic', true)
    this.addGroupFromTiled('Basement', 'basement', 'Basement', true)

    // Have my player plays facing up animation
    const parts = this.myPlayer.anims.currentAnim.key.split('_')
    parts[2] = 'up'
    this.myPlayer.play(parts.join('_'), true)

    this.physics.add.collider([this.myPlayer, this.myPlayer.playerContainer], groundLayer)
    this.physics.add.overlap(
      this.playerSelector,
      [chairs, computers, whiteboards],
      this.handleItemSelectorOverlap,
      undefined,
      this
    )
  }

  private handleItemSelectorOverlap(playerSelector, selectionItem) {
    const currentItem = playerSelector.selectedItem as Item
    // currentItem is undefined if nothing was perviously selected
    if (currentItem) {
      // if the selection has not changed, do nothing
      if (currentItem === selectionItem || currentItem.depth >= selectionItem.depth) {
        return
      }
      // if selection changes, clear pervious dialog
      if (this.myPlayer.playerBehavior !== PlayerBehavior.SITTING) currentItem.clearDialogBox()
    }

    // set selected item and set up new dialog
    playerSelector.selectedItem = selectionItem
    selectionItem.onOverlapDialog()
  }

  private addObjectFromTiled(
    group: Phaser.Physics.Arcade.StaticGroup,
    object: Phaser.Types.Tilemaps.TiledObject,
    key: string,
    tilesetName: string
  ) {
    const actualX = object.x! + object.width! * 0.5
    const actualY = object.y! - object.height! * 0.5
    const obj = group
      .get(actualX, actualY, key, object.gid! - this.map.getTileset(tilesetName).firstgid)
      .setDepth(actualY)
    return obj
  }
}
