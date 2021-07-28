import { Schema, MapSchema } from '@colyseus/schema'

export interface IPlayer extends Schema {
  x: number
  y: number
  anim: string
}

export interface IOfficeState extends Schema {
  players: MapSchema<IPlayer>
}
