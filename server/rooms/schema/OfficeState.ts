import { Schema, ArraySchema, MapSchema, Context, type } from '@colyseus/schema'
import { IPlayer, IOfficeState, IComputer } from '../../../types/IOfficeState'

export class Player extends Schema implements IPlayer {
  @type('string') name = ''
  @type('number') x = 705
  @type('number') y = 500
  @type('string') anim = 'adam_idle_down'
  @type('boolean') readyToConnect = false
  @type('boolean') videoConnected = false
}

export class Computer extends Schema implements IComputer {
  @type(['string']) connectedUser = new ArraySchema<string>()
}

export class ChatMessage extends Schema implements IComputer {
  @type('number') createdAt = new Date().getTime()
  @type('string') content: ''
}

export class OfficeState extends Schema implements IOfficeState {
  @type({ map: Player })
  players = new MapSchema<Player>()

  @type({ map: Computer })
  computers = new MapSchema<Computer>()

  @type([ChatMessage])
  chatMessages = new ArraySchema<ChatMessage>()
}
