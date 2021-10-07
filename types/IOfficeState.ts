import { Schema, MapSchema } from '@colyseus/schema'

export interface IComputer extends Schema {
  connectedUser: [string]
}

export interface IPlayer extends Schema {
  name: string
  x: number
  y: number
  anim: string
  readyToConnect: boolean
}

export interface IOfficeState extends Schema {
  players: MapSchema<IPlayer>
  computers: MapSchema<IComputer>
}
