import Phaser from 'phaser'

import { debugDraw } from '../utils/debug'
import { createCharacterAnims } from '../anims/CharacterAnims'

import Item from '../items/Item'
import '../characters/MyPlayer'
import PlayerSelector from '../characters/PlayerSelector'
import Network from '../services/Network'
import { IPlayer } from '~/types/IOfficeState'
import OtherPlayer from '../characters/OtherPlayer'

export default class Game extends Phaser.Scene {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private keyE!: Phaser.Input.Keyboard.Key
  private map!: Phaser.Tilemaps.Tilemap
  private myPlayer!: Phaser.Physics.Arcade.Sprite
  private items!: Phaser.Physics.Arcade.StaticGroup
  private playerSelector!: Phaser.GameObjects.Zone
  private network?: Network
  private otherPlayers?: Phaser.Physics.Arcade.Group

  constructor() {
    super('game')
  }

  init() {
    this.network = new Network()
  }

  preload() {
    this.cursors = this.input.keyboard.createCursorKeys()
    // maybe we can have a dedicated method for adding keys if more keys are needed in the future
    this.keyE = this.input.keyboard.addKey('E')
  }

  async create() {
    // initialize network instance (connect to server)
    if (!this.network) {
      throw new Error('server instance missing')
    }
    await this.network.join()

    createCharacterAnims(this.anims)

    this.map = this.make.tilemap({ key: 'tilemap' })
    const FloorAndGround = this.map.addTilesetImage('FloorAndGround', 'tiles_wall')

    const groundLayer = this.map.createLayer('Ground', FloorAndGround)
    groundLayer.setCollisionByProperty({ collides: true })

    // debugDraw(groundLayer, this)

    this.myPlayer = this.add.myPlayer(705, 500, 'player')
    this.playerSelector = new PlayerSelector(this, 0, 0, 16, 16)

    // import item objects (currently chairs) from Tiled map to Phaser
    this.items = this.physics.add.staticGroup({ classType: Item })
    const chairLayer = this.map.getObjectLayer('Chair')
    chairLayer.objects.forEach((chairObj) => {
      const item = this.addObjectFromTiled(this.items, chairObj, 'chairs', 'chair') as Item
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
    this.cameras.main.startFollow(this.myPlayer, true)

    this.physics.add.collider(this.myPlayer, groundLayer)
    this.physics.add.overlap(
      this.playerSelector,
      this.items,
      this.handleItemSelectorOverlap,
      undefined,
      this
    )

    // register network event listeners
    this.network.onPlayerJoined(this.handlePlayerJoined, this)
    this.network.onPlayerLeft(this.handlePlayerLeft, this)
    this.network.onPlayerUpdated(this.handlePlayerUpdated, this)
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
    if (this.myPlayer && collidable) this.physics.add.collider(this.myPlayer, group)
  }

  // Add new player to the otherPlayer group
  private handlePlayerJoined(newPlayer: IPlayer, key: string) {
    if (!this.otherPlayers) {
      this.otherPlayers = this.physics.add.group({ classType: OtherPlayer })
    }
    this.otherPlayers.get(newPlayer.x, newPlayer.y, 'player', key) as OtherPlayer
  }

  // removed the player who left from the otherPlayer group
  private handlePlayerLeft(key: string) {
    const player = this.getOtherPlayerByID(key)
    if (player) {
      this.otherPlayers?.remove(player, true, true)
    }
  }

  // call update target position when receive player updates
  private handlePlayerUpdated(field: string, value: number | string, key: string) {
    const player = this.getOtherPlayerByID(key) as OtherPlayer
    if (player) {
      player.updateTargetPosition(field, value)
    }
  }

  private getOtherPlayerByID(key: string) {
    return this.otherPlayers
      ?.getChildren()
      .find((player) => (player as OtherPlayer).playerId === key)
  }

  update(t: number, dt: number) {
    if (this.myPlayer) {
      this.playerSelector.update(this.myPlayer, this.cursors)
      this.myPlayer.update(this.playerSelector, this.cursors, this.keyE, this.network)
    }
  }
}
