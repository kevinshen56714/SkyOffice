import MyPlayer from '../characters/MyPlayer'
import PlayerSelector from '../characters/PlayerSelector'
import TeleportZone from '../zones/TeleportZone'
import { createCharacterAnims } from '../anims/CharacterAnims'
import { createItemAnims } from '../anims/ItemAnims'
import { ISceneData } from '../../../types/Scenes'

import network from '../services/Network'
import store from '../stores'
import { setFocused, setShowChat } from '../stores/ChatStore'

export default class Scene extends Phaser.Scene {
  myPlayer!: MyPlayer
  map!: Phaser.Tilemaps.Tilemap
  playerSelector!: Phaser.GameObjects.Zone
  teleportZoneMap = new Map<string, TeleportZone>()
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private keyE!: Phaser.Input.Keyboard.Key
  private keyR!: Phaser.Input.Keyboard.Key
  onLeave!: (teleportTo?: string) => void

  create(data: ISceneData) {
    if (!network) {
      throw new Error('server instance missing')
    }

    this.onLeave = data.onLeave

    createCharacterAnims(this.anims)
    createItemAnims(this.anims)
    this.registerKeys()

    const { name, texture } = store.getState().user
    this.myPlayer = this.add.myPlayer(0, 0, texture || 'adam', network.mySessionId, name)
    this.playerSelector = new PlayerSelector(this, 0, 0, 16, 16)

    this.cameras.main.zoom = 1.5
    this.cameras.main.startFollow(this.myPlayer, true)

    const teleportZoneGroup = this.physics.add.staticGroup({ classType: TeleportZone })
    const teleportZoneLayer = this.map.getObjectLayer('TeleportZones')
    teleportZoneLayer.objects.forEach((object) => {
      const { x, y, width, height } = object
      // custom properties[0] is the teleportTo property specified in Tiled
      const teleportTo = object.properties[0].value
      const teleportZone = new TeleportZone(this, x!, y!, width!, height!, teleportTo).setOrigin(0)
      teleportZoneGroup.add(teleportZone)
      this.teleportZoneMap.set(teleportTo, teleportZone)
    })

    this.physics.add.overlap(
      this.myPlayer,
      teleportZoneGroup,
      this.handlePlayerTeleportZoneOverlap,
      undefined,
      this
    )
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

  private handlePlayerTeleportZoneOverlap(myPlayer, teleportZone) {
    this.onLeave(teleportZone.teleportTo)
  }
}
