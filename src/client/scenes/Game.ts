import Phaser from 'phaser'
import * as Colyseus from 'colyseus.js'

import { debugDraw } from '../utils/debug'
import { createCharacterAnims } from '../anims/CharacterAnims'

import Item from '../items/Item'
import '../characters/Player'
import PlayerSelector from '../characters/PlayerSelector'

export default class Game extends Phaser.Scene {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private map!: Phaser.Tilemaps.Tilemap
  private player!: Phaser.Physics.Arcade.Sprite
  private items!: Phaser.Physics.Arcade.StaticGroup
  private playerSelector!: Phaser.GameObjects.Zone
  private client!: Colyseus.Client

  constructor() {
    super('game')
  }

  async init() {
    const protocol = window.location.protocol.replace('http', 'ws')
    const endpoint =
      process.env.NODE_ENV === 'production'
        ? `wss://sky-office.herokuapp.com`
        : `${protocol}//${window.location.hostname}:2567`
    this.client = new Colyseus.Client(endpoint)
    const room = await this.client.joinOrCreate('skyoffice')
  }

  preload() {
    this.cursors = this.input.keyboard.createCursorKeys()
  }

  async create() {
    createCharacterAnims(this.anims)

    this.map = this.make.tilemap({ key: 'tilemap' })
    const FloorAndGround = this.map.addTilesetImage('FloorAndGround', 'tiles_wall')

    const groundLayer = this.map.createLayer('Ground', FloorAndGround)
    groundLayer.setCollisionByProperty({ collides: true })

    // debugDraw(groundLayer, this)

    this.player = this.add.player(705, 500, 'player')
    this.playerSelector = new PlayerSelector(this, 0, 0, 16, 16)

    // import item objects (currently chairs) from Tiled map to Phaser
    this.items = this.physics.add.staticGroup({ classType: Item })
    const chairLayer = this.map.getObjectLayer('Chair')
    chairLayer.objects.forEach((chairObj) => {
      const item = this.addObjectFromTiled(this.items, chairObj, 'chairs', 'chair')
      // custom properties[0] is the object direction specified in Tiled
      item.itemDirection = chairObj.properties[0].value
    })

    // import other objects from Tiled map to Phaser
    this.addGroupFromTiled('Wall', 'tiles_wall', 'FloorAndGround', false)
    this.addGroupFromTiled('Objects', 'office', 'Modern_Office_Black_Shadow', false)
    this.addGroupFromTiled('GenericObjects', 'generic', 'Generic', false)
    this.addGroupFromTiled('ObjectsOnCollide', 'office', 'Modern_Office_Black_Shadow', true)
    this.addGroupFromTiled('GenericObjectsOnCollide', 'generic', 'Generic', true)

    this.cameras.main.zoom = 1.5
    this.cameras.main.startFollow(this.player, true)

    this.physics.add.collider(this.player, groundLayer)
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

  private addGroupFromTiled(
    objectLayerName: string,
    key: string,
    tilesetName: string,
    collidable: boolean
  ) {
    const group = this.physics.add.staticGroup()
    const objectLayer = this.map.getObjectLayer(objectLayerName)
    objectLayer.objects.forEach((object) => {
      const actualX = object.x! + object.width! * 0.5
      const actualY = object.y! - object.height! * 0.5
      group
        .get(actualX, actualY, key, object.gid! - this.map.getTileset(tilesetName).firstgid)
        .setDepth(actualY)
    })
    if (this.player && collidable) this.physics.add.collider(this.player, group)
  }

  update(t: number, dt: number) {
    if (this.player) {
      this.playerSelector.update(this.player, this.cursors)
      this.player.update(this.playerSelector, this.cursors)
    }
  }
}
