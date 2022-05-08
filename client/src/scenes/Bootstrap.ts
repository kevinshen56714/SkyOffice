import Phaser from 'phaser'
import Network from '../services/Network'
import { BackgroundMode } from '../../../types/BackgroundMode'
import store from '../stores'
import { setRoomJoined } from '../stores/RoomStore'

import {
  CloudDayImg,
  CloudDaySettings,
  CloudNightImg,
  CloudNightSettings,
  BackDropDayImg,
  BackDropNightImg,
  SunMoonImg,
  MapSettings,
  FloorAndGroundImg,
  ChairImg,
  ComputerImg,
  WhiteboardImg,
  VendingMachineImg,
  OfficeImg,
  BasementImg,
  GenericImg,
  AdamImg,
  AshImg,
  LucyImg,
  NancyImg,
} from '../assets'

export default class Bootstrap extends Phaser.Scene {
  network!: Network

  constructor() {
    super('bootstrap')
  }

  preload() {
    this.load.atlas('cloud_day', CloudDayImg, CloudDaySettings)
    this.load.image('backdrop_day', BackDropDayImg)
    this.load.atlas('cloud_night', CloudNightImg, CloudNightSettings)
    this.load.image('backdrop_night', BackDropNightImg)
    this.load.image('sun_moon', SunMoonImg)

    this.load.tilemapTiledJSON('tilemap', MapSettings)
    this.load.spritesheet('tiles_wall', FloorAndGroundImg, {
      frameWidth: 32,
      frameHeight: 32,
    })
    this.load.spritesheet('chairs', ChairImg, {
      frameWidth: 32,
      frameHeight: 64,
    })
    this.load.spritesheet('computers', ComputerImg, {
      frameWidth: 96,
      frameHeight: 64,
    })
    this.load.spritesheet('whiteboards', WhiteboardImg, {
      frameWidth: 64,
      frameHeight: 64,
    })
    this.load.spritesheet('vendingmachines', VendingMachineImg, {
      frameWidth: 48,
      frameHeight: 72,
    })
    this.load.spritesheet('office', OfficeImg, {
      frameWidth: 32,
      frameHeight: 32,
    })
    this.load.spritesheet('basement', BasementImg, {
      frameWidth: 32,
      frameHeight: 32,
    })
    this.load.spritesheet('generic', GenericImg, {
      frameWidth: 32,
      frameHeight: 32,
    })
    this.load.spritesheet('adam', AdamImg, {
      frameWidth: 32,
      frameHeight: 48,
    })
    this.load.spritesheet('ash', AshImg, {
      frameWidth: 32,
      frameHeight: 48,
    })
    this.load.spritesheet('lucy', LucyImg, {
      frameWidth: 32,
      frameHeight: 48,
    })
    this.load.spritesheet('nancy', NancyImg, {
      frameWidth: 32,
      frameHeight: 48,
    })
  }

  init() {
    this.network = new Network()
  }

  create() {
    this.launchBackground(store.getState().user.backgroundMode)
  }

  private launchBackground(backgroundMode: BackgroundMode) {
    this.scene.launch('background', { backgroundMode })
  }

  launchGame() {
    this.network.webRTC?.checkPreviousPermission()
    this.scene.launch('game', {
      network: this.network,
    })

    // update Redux state
    store.dispatch(setRoomJoined(true))
  }

  changeBackgroundMode(backgroundMode: BackgroundMode) {
    this.scene.stop('background')
    this.launchBackground(backgroundMode)
  }
}
