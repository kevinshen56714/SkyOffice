import { Schema, ArraySchema, Context, type } from '@colyseus/schema'
import { IPositionState, IPlayerState, IOfficeState } from '~/types/IOfficeState'
import { PlayerBehavior } from '~/types/PlayerBehavior'

export class PositionState extends Schema implements IPositionState {
  @type('number') x = 705
  @type('number') y = 500
}

export class PlayerState extends Schema implements IPlayerState {
  @type('number')
  playerID: number
  @type([PositionState])
  playerPosition: ArraySchema<IPositionState>
  @type('number')
  playerBehavior = PlayerBehavior.IDLE

  constructor(id) {
    super()

    this.playerID = id
    this.playerPosition = new ArraySchema()
    this.playerPosition.push(new PositionState())
  }
}

export class OfficeState extends Schema implements IOfficeState {
  @type([PlayerState])
  playerStates: ArraySchema<IPlayerState>

  constructor() {
    super()

    this.playerStates = new ArraySchema()
  }
}
