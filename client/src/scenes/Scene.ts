import MyPlayer from '../characters/MyPlayer'
import PlayerSelector from '../characters/PlayerSelector'
import OtherPlayer from '../characters/OtherPlayer'
import TeleportZone from '../zones/TeleportZone'
import Computer from '../items/Computer'
import Whiteboard from '../items/Whiteboard'
import { createCharacterAnims } from '../anims/CharacterAnims'
import { createItemAnims } from '../anims/ItemAnims'
import { IPlayer } from '../../../types/IOfficeState'
import { ItemType } from '../../../types/Items'

import network from '../services/Network'
import store from '../stores'
import { setFocused, setShowChat } from '../stores/ChatStore'

export interface ISceneData {
  onLeave: (teleportZone?: TeleportZone) => void
  enterX?: number
  enterY?: number
  teleportTo?: string
}

export default class Scene extends Phaser.Scene {
  myPlayer!: MyPlayer
  map!: Phaser.Tilemaps.Tilemap
  playerSelector!: Phaser.GameObjects.Zone
  computerMap = new Map<string, Computer>()
  whiteboardMap = new Map<string, Whiteboard>()
  private otherPlayers!: Phaser.Physics.Arcade.Group
  private otherPlayerMap = new Map<string, OtherPlayer>()
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private keyE!: Phaser.Input.Keyboard.Key
  private keyR!: Phaser.Input.Keyboard.Key
  onLeave!: (teleportZone?: TeleportZone) => void

  create(data: ISceneData) {
    if (!network) {
      throw new Error('server instance missing')
    }

    this.onLeave = data.onLeave

    createCharacterAnims(this.anims)
    createItemAnims(this.anims)
    this.registerKeys()

    const { name, texture } = store.getState().user
    this.myPlayer = this.add.myPlayer(
      data.enterX || 0,
      data.enterY || 0,
      texture || 'adam',
      network.webRTCId,
      name
    )
    this.playerSelector = new PlayerSelector(this, 0, 0, 16, 16)

    this.otherPlayers = this.physics.add.group({ classType: OtherPlayer })

    this.cameras.main.zoom = 1.5
    this.cameras.main.startFollow(this.myPlayer, true)

    const teleportZoneGroup = this.physics.add.staticGroup({ classType: TeleportZone })
    const teleportZoneLayer = this.map.getObjectLayer('TeleportZones')
    teleportZoneLayer?.objects.forEach((object) => {
      const { x, y, width, height } = object
      // custom properties[0] is the teleportTo property specified in Tiled
      const teleportTo = object.properties[0].value
      const teleportZone = new TeleportZone(this, x!, y!, width!, height!, teleportTo).setOrigin(0)
      teleportZoneGroup.add(teleportZone)
    })

    this.physics.add.overlap(
      this.myPlayer,
      teleportZoneGroup,
      this.handlePlayerTeleportZoneOverlap,
      undefined,
      this
    )

    this.physics.add.overlap(
      this.myPlayer,
      this.otherPlayers,
      this.handlePlayersOverlap,
      undefined,
      this
    )

    // register network event listeners
    network.onPlayerJoined(this.handlePlayerJoined, this)
    network.onPlayerLeft(this.handlePlayerLeft, this)
    network.onPlayerUpdated(this.handlePlayerUpdated, this)
    network.onMyPlayerReady(this.handleMyPlayerReady, this)
    network.onMyPlayerVideoConnected(this.handleMyVideoConnected, this)
    network.onItemUserAdded(this.handleItemUserAdded, this)
    network.onItemUserRemoved(this.handleItemUserRemoved, this)
    network.onChatMessageAdded(this.handleChatMessageAdded, this)
  }

  update() {
    if (this.myPlayer) {
      this.playerSelector.update(this.myPlayer, this.cursors)
      this.myPlayer.update(this.playerSelector, this.cursors, this.keyE, this.keyR)
    }
  }

  private registerKeys() {
    this.cursors = this.input.keyboard.createCursorKeys()
    this.keyE = this.input.keyboard.addKey('E')
    this.keyR = this.input.keyboard.addKey('R')
    this.input.keyboard.disableGlobalCapture()
    this.input.keyboard.on('keydown-ENTER', () => {
      store.dispatch(setShowChat(true))
      store.dispatch(setFocused(true))
    })
    this.input.keyboard.on('keydown-ESC', () => store.dispatch(setShowChat(false)))
    if (!store.getState().user.loggedIn) this.disableKeys()
  }

  disableKeys() {
    this.input.keyboard.enabled = false
  }

  enableKeys() {
    this.input.keyboard.enabled = true
  }

  addGroupFromTiled(
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
    if (this.myPlayer && collidable)
      this.physics.add.collider([this.myPlayer, this.myPlayer.playerContainer], group)
  }

  private handlePlayersOverlap(myPlayer, otherPlayer) {
    otherPlayer.makeCall(myPlayer)
  }

  // function to add new player to the otherPlayer group
  private handlePlayerJoined(newPlayer: IPlayer, id: string) {
    const otherPlayer = this.add.otherPlayer(
      newPlayer.x,
      newPlayer.y,
      newPlayer.anim.split('_')[0],
      id,
      newPlayer.name
    )
    this.otherPlayers.add(otherPlayer)
    this.otherPlayerMap.set(id, otherPlayer)
  }

  // function to remove the player who left from the otherPlayer group
  private handlePlayerLeft(id: string) {
    if (this.otherPlayerMap.has(id)) {
      const otherPlayer = this.otherPlayerMap.get(id)
      if (!otherPlayer) return
      this.otherPlayers.remove(otherPlayer, true, true)
      this.otherPlayerMap.delete(id)
    }
  }

  // function to update target position upon receiving player updates
  private handlePlayerUpdated(field: string, value: number | string, id: string) {
    const otherPlayer = this.otherPlayerMap.get(id)
    otherPlayer?.updateOtherPlayer(field, value)
  }

  private handleMyPlayerReady() {
    this.myPlayer.readyToConnect = true
  }

  private handleMyVideoConnected() {
    this.myPlayer.videoConnected = true
  }

  private handleItemUserAdded(playerId: string, itemId: string, itemType: ItemType) {
    if (itemType === ItemType.COMPUTER) {
      const computer = this.computerMap.get(itemId)
      computer?.addCurrentUser(playerId)
    } else if (itemType === ItemType.WHITEBOARD) {
      const whiteboard = this.whiteboardMap.get(itemId)
      whiteboard?.addCurrentUser(playerId)
    }
  }

  private handleItemUserRemoved(playerId: string, itemId: string, itemType: ItemType) {
    if (itemType === ItemType.COMPUTER) {
      const computer = this.computerMap.get(itemId)
      computer?.removeCurrentUser(playerId)
    } else if (itemType === ItemType.WHITEBOARD) {
      const whiteboard = this.whiteboardMap.get(itemId)
      whiteboard?.removeCurrentUser(playerId)
    }
  }

  private handleChatMessageAdded(playerId: string, content: string) {
    const otherPlayer = this.otherPlayerMap.get(playerId)
    otherPlayer?.updateDialogBubble(content)
  }

  private handlePlayerTeleportZoneOverlap(myPlayer, teleportZone) {
    this.onLeave(teleportZone)
  }
}
