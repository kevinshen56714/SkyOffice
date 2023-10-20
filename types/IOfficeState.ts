import { Schema, ArraySchema, MapSchema } from '@colyseus/schema'
import { ChatMessage, Computer, Player, Whiteboard } from '../server/rooms/schema/OfficeState'

export interface IOfficeState extends Schema {
  players: MapSchema<Player>
  computers: MapSchema<Computer>
  whiteboards: MapSchema<Whiteboard>
  chatMessages: ArraySchema<ChatMessage>
}
