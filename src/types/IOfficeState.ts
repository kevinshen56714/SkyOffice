import { Schema, ArraySchema } from '@colyseus/schema'
import { PlayerBehavior } from './PlayerBehavior'

export interface IPositionState extends Schema {
  x: number
  y: number
}

export interface IPlayerState extends Schema {
  playerID: number
  playerPosition: ArraySchema<IPositionState>
  playerBehavior: PlayerBehavior
}

export interface IOfficeState extends Schema {
  playerStates: ArraySchema<IPlayerState>
}
