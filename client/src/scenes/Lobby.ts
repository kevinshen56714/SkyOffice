import Scene, { ISceneData } from './Scene'
import network from '../services/Network'

export default class Lobby extends Scene {
  constructor() {
    super('lobby')
  }

  async create(data: ISceneData) {
    this.map = this.make.tilemap({ key: 'lobby_map' })
    super.create(data)

    if (data.enterX && data.enterY) {
      await network.joinOrCreateLobby(data.enterX, data.enterY + 32)
    } else {
      await network.joinOrCreateLobby()
    }

    const FloorAndGround = this.map.addTilesetImage('FloorAndGround', 'tiles_wall')
    const Upstairs = this.map.addTilesetImage('UpstairsConnectorsStairsAndOthers', 'upstairs')

    const groundLayer = this.map
      .createLayer('Ground', FloorAndGround)
      .setDepth(-10000)
      .setCollisionByProperty({ collides: true })

    const lowDepthLayer = this.map
      .createLayer('LowDepth', Upstairs)
      .setDepth(-10000)
      .setCollisionByProperty({ collides: true })

    this.map.createLayer('MidDepth', Upstairs).setDepth(-5000)
    this.map.createLayer('HighDepth', FloorAndGround).setDepth(10000)

    const colliderGroup = this.physics.add.staticGroup()
    const colliderLayer = this.map.getObjectLayer('Colliders')
    colliderLayer.objects.forEach((object) => {
      const { x, y, width, height } = object
      const collisionRegion = this.add.zone(x!, y!, width!, height!).setOrigin(0)
      colliderGroup.add(collisionRegion)
    })

    const escalatorGroup = this.physics.add.staticGroup()
    const escalatorLayer = this.map.getObjectLayer('Escalators')
    escalatorLayer.objects.forEach((object) => {
      const { x, y, width, height } = object
      const actualX = x! + width! * 0.5
      const actualY = y! - height! * 0.5

      // custom properties[0] is the object direction specified in Tiled
      const direction = object.properties[0].value
      const escalator = escalatorGroup
        .get(actualX, actualY)
        .setDepth(actualY - height! * 0.5)
        .anims.play(`escalator_${direction}`)
        .setOffset(4, -32)
      escalator.body.width = width! * 0.25
      escalator.body.height = height! * 0.75
    })

    const receptionistGroup = this.physics.add.staticGroup()
    const receptionistLayer = this.map.getObjectLayer('Receptionists')
    receptionistLayer.objects.forEach((object, id) => {
      const { x, y, width, height } = object
      const actualX = x! + width! * 0.5
      const actualY = y! - height! * 0.5
      receptionistGroup
        .get(actualX, actualY)
        .setDepth(actualY)
        .anims.play(`receptionist_${id % 2}`)
    })

    this.addGroupFromTiled('ClassroomObjects', 'classroom', 'Classroom_and_library', false)
    this.addGroupFromTiled(
      'UpstairsObjects',
      'upstairs',
      'UpstairsConnectorsStairsAndOthers',
      false
    )
    this.addGroupFromTiled('Glassdoor', 'glassdoor', 'glassdoor', false)

    this.physics.add.collider([this.myPlayer, this.myPlayer.playerContainer], colliderGroup)
    this.physics.add.collider(
      [this.myPlayer, this.myPlayer.playerContainer],
      [groundLayer, lowDepthLayer]
    )

    this.physics.add.overlap(
      this.myPlayer,
      escalatorGroup,
      this.handlePlayerEscalatorOverlap,
      undefined,
      this
    )
  }

  private handlePlayerEscalatorOverlap(myPlayer, escalator) {
    if (!myPlayer.escalatorOnTouch) myPlayer.escalatorOnTouch = escalator
  }
}
