import { Schema, MapSchema } from '@colyseus/schema'
import { PlayerBehavior } from './PlayerBehavior'

export interface IPlayer extends Schema {
  x: number
  y: number
  playerBehavior: PlayerBehavior
}

export interface IOfficeState extends Schema {
  players: MapSchema<IPlayer>
}
