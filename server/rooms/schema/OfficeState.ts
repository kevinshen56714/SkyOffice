import crypto from 'crypto'
import { Schema, ArraySchema, SetSchema, MapSchema, type } from '@colyseus/schema'
import {
  IPlayer,
  IOfficeState,
  IComputer,
  IWhiteboard,
  IChatMessage,
} from '../../../types/IOfficeState'

export class Player extends Schema implements IPlayer {
  @type('string') name = ''
  @type('number') x = 705
  @type('number') y = 500
  @type('string') anim = 'adam_idle_down'
  @type('string') avatar = ''
  @type('boolean') readyToConnect = false
  @type('boolean') videoConnected = false
}

export class Computer extends Schema implements IComputer {
  @type({ set: 'string' }) connectedUser = new SetSchema<string>()
}

export class Whiteboard extends Schema implements IWhiteboard {
  @type('string') roomId = getRoomId()
  @type({ set: 'string' }) connectedUser = new SetSchema<string>()
}

export class ChatMessage extends Schema implements IChatMessage {
  @type('string') author = ''
  @type('number') createdAt = new Date().getTime()
  @type('string') content = ''
}

export class OfficeState extends Schema implements IOfficeState {
  @type({ map: Player })
  players = new MapSchema<Player>()

  @type({ map: Computer })
  computers = new MapSchema<Computer>()

  @type({ map: Whiteboard })
  whiteboards = new MapSchema<Whiteboard>()

  @type([ChatMessage])
  chatMessages = new ArraySchema<ChatMessage>()
}

/**
 * This id is the only thing protecting a whiteboard: the client turns it
 * straight into a public wbo.ophir.dev board URL. Math.random is not a CSPRNG -
 * its state can be recovered from a handful of outputs, and every room hands an
 * observer three ids on join - so board URLs minted for other rooms would be
 * predictable. 128 bits from the CSPRNG also makes collisions impossible, so
 * the old retry bookkeeping is gone.
 */
function getRoomId(): string {
  return crypto.randomBytes(16).toString('base64url')
}
