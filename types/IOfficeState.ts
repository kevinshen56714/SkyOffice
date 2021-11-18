import { Schema, ArraySchema, MapSchema } from '@colyseus/schema'

export interface IPlayer extends Schema {
  name: string
  x: number
  y: number
  anim: string
  readyToConnect: boolean
  videoConnected: boolean
}

export interface IComputer extends Schema {
  connectedUser: ArraySchema<string>
}

export interface IChatMessage extends Schema {
  createdAt: number
  content: string
}

export interface IOfficeState extends Schema {
  players: MapSchema<IPlayer>
  computers: MapSchema<IComputer>
  chatMessages: ArraySchema<IChatMessage>
}
