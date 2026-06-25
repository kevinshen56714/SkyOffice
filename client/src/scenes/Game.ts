import Phaser from 'phaser'

// import { debugDraw } from '../utils/debug'
import { createCharacterAnims } from '../anims/CharacterAnims'

import Item from '../items/Item'
import Computer from '../items/Computer'
import Whiteboard from '../items/Whiteboard'
import '../characters/MyPlayer'
import '../characters/OtherPlayer'
import MyPlayer from '../characters/MyPlayer'
import OtherPlayer from '../characters/OtherPlayer'
import PlayerSelector from '../characters/PlayerSelector'
import Network from '../services/Network'
import { Layout, MapObject, MyDesk } from '../services/Api'
import { buildTilemap, queueTilesetLoads } from '../services/mapBuilder'
import { IPlayer } from '../../../types/IOfficeState'
import { PlayerBehavior } from '../../../types/PlayerBehavior'
import { ItemType } from '../../../types/Items'

import store from '../stores'
import { setFocused, setShowChat } from '../stores/ChatStore'
import { setLoggedIn } from '../stores/UserStore'
import { NavKeys, Keyboard } from '../../../types/KeyboardState'

export default class Game extends Phaser.Scene {
  network!: Network
  private cursors!: NavKeys
  private keyE!: Phaser.Input.Keyboard.Key
  private keyR!: Phaser.Input.Keyboard.Key
  private map!: Phaser.Tilemaps.Tilemap
  myPlayer!: MyPlayer
  private playerSelector!: Phaser.GameObjects.Zone
  private otherPlayers!: Phaser.Physics.Arcade.Group
  private otherPlayerMap = new Map<string, OtherPlayer>()
  computerMap = new Map<string, Computer>()
  private whiteboardMap = new Map<string, Whiteboard>()
  private layout!: Layout
  private mapObjects!: MapObject[]
  private desk!: MyDesk

  constructor() {
    super('game')
  }

  registerKeys() {
    this.cursors = {
      ...this.input.keyboard.createCursorKeys(),
      ...(this.input.keyboard.addKeys('W,S,A,D') as Keyboard),
    }

    // maybe we can have a dedicated method for adding keys if more keys are needed in the future
    this.keyE = this.input.keyboard.addKey('E')
    this.keyR = this.input.keyboard.addKey('R')
    this.input.keyboard.disableGlobalCapture()
    this.input.keyboard.on('keydown-ENTER', (event) => {
      store.dispatch(setShowChat(true))
      store.dispatch(setFocused(true))
    })
    this.input.keyboard.on('keydown-ESC', (event) => {
      store.dispatch(setShowChat(false))
    })
  }

  disableKeys() {
    this.input.keyboard.enabled = false
  }

  enableKeys() {
    this.input.keyboard.enabled = true
  }

  create(data: { network: Network; layout: Layout; mapObjects: MapObject[]; desk: MyDesk }) {
    if (!data.network) {
      throw new Error('server instance missing')
    }
    this.network = data.network
    this.layout = data.layout
    this.mapObjects = data.mapObjects
    this.desk = data.desk

    createCharacterAnims(this.anims)

    // The tilemap is built at runtime from the backend layout (INTEGRATION.md §3). Tileset images
    // must be present before make.tilemap, so queue any that aren't loaded yet, then build.
    queueTilesetLoads(this, this.layout)
    if (this.load.list.size === 0) {
      this.buildScene()
    } else {
      this.load.once(Phaser.Loader.Events.COMPLETE, () => this.buildScene())
      this.load.start()
    }
  }

  private buildScene() {
    const { collisionLayers } = buildTilemap(this, this.layout)

    // Spawn from the user's desk: position, avatar, and name all come from the backend.
    const avatar = this.desk.avatarCharacter.toLowerCase()
    this.myPlayer = this.add.myPlayer(
      this.desk.positionX,
      this.desk.positionY,
      avatar,
      this.network.mySessionId
    )
    this.playerSelector = new PlayerSelector(this, 0, 0, 16, 16)

    // Place computers/whiteboards from the persisted MapObjects, keyed by their backend id so the
    // Colyseus state (also keyed by id) drives connected users and the whiteboard roomId.
    const computers = this.physics.add.staticGroup({ classType: Computer })
    const whiteboards = this.physics.add.staticGroup({ classType: Whiteboard })
    this.mapObjects
      .filter((obj) => obj.isActive)
      .forEach((obj) => {
        const id = `${obj.id}`
        if (obj.type === 'COMPUTER') {
          const item = computers.get(obj.positionX, obj.positionY, 'computers') as Computer
          item.id = id
          item.setDepth(item.y + item.height * 0.27)
          this.computerMap.set(id, item)
        } else if (obj.type === 'WHITEBOARD') {
          const item = whiteboards.get(obj.positionX, obj.positionY, 'whiteboards') as Whiteboard
          item.id = id
          this.whiteboardMap.set(id, item)
        }
      })

    this.otherPlayers = this.physics.add.group({ classType: OtherPlayer })

    this.cameras.main.zoom = 1.5
    this.cameras.main.startFollow(this.myPlayer, true)

    for (const layer of collisionLayers) {
      this.physics.add.collider([this.myPlayer, this.myPlayer.playerContainer], layer)
    }

    this.physics.add.overlap(
      this.playerSelector,
      [computers, whiteboards],
      this.handleItemSelectorOverlap,
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
    this.network.onPlayerJoined(this.handlePlayerJoined, this)
    this.network.onPlayerLeft(this.handlePlayerLeft, this)
    this.network.onMyPlayerReady(this.handleMyPlayerReady, this)
    this.network.onMyPlayerVideoConnected(this.handleMyVideoConnected, this)
    this.network.onPlayerUpdated(this.handlePlayerUpdated, this)
    this.network.onItemUserAdded(this.handleItemUserAdded, this)
    this.network.onItemUserRemoved(this.handleItemUserRemoved, this)
    this.network.onChatMessageAdded(this.handleChatMessageAdded, this)

    // Desk-driven identity replaces the typed login dialog: set name/avatar, wire input, signal
    // readiness to the server, then reveal the in-game UI.
    this.registerKeys()
    this.myPlayer.setPlayerName(this.desk.fullName)
    this.myPlayer.setPlayerTexture(avatar)
    this.network.readyToConnect()
    store.dispatch(setLoggedIn(true))
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

  // function to add new player to the otherPlayer group
  private handlePlayerJoined(newPlayer: IPlayer, id: string) {
    if (this.otherPlayerMap.has(id)) return // idempotent: onAdd and the initial onChange can both fire
    // Their avatar comes from their anim key (e.g. "lucy_idle_down"); default to adam.
    const texture = newPlayer.anim?.split('_')[0] || 'adam'
    const otherPlayer = this.add.otherPlayer(newPlayer.x, newPlayer.y, texture, id, newPlayer.name)
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

  private handleMyPlayerReady() {
    this.myPlayer.readyToConnect = true
  }

  private handleMyVideoConnected() {
    this.myPlayer.videoConnected = true
  }

  // function to update target position upon receiving player updates
  private handlePlayerUpdated(field: string, value: number | string, id: string) {
    const otherPlayer = this.otherPlayerMap.get(id)
    otherPlayer?.updateOtherPlayer(field, value)
  }

  private handlePlayersOverlap(myPlayer, otherPlayer) {
    otherPlayer.makeCall(myPlayer, this.network?.webRTC)
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

  update(t: number, dt: number) {
    if (this.myPlayer && this.network) {
      this.playerSelector.update(this.myPlayer, this.cursors)
      this.myPlayer.update(this.playerSelector, this.cursors, this.keyE, this.keyR, this.network)
    }
  }
}
