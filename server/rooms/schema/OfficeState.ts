import { Schema, ArraySchema, MapSchema, type } from '@colyseus/schema'
import { IPlayer, IOfficeState, IComputer, IWhiteboard } from '../../../types/IOfficeState'

export class Computer extends Schema implements IComputer {
  @type(['string']) connectedUser = new ArraySchema<string>()
}

export class Whiteboard extends Schema implements IWhiteboard {
  @type('string') roomId = getRoomId()
  @type('string') encryptionId = getEncryptionId()
  @type(['string']) connectedUser = new ArraySchema<string>()
}

export class Player extends Schema implements IPlayer {
  @type('string') name = ''
  @type('number') x = 705
  @type('number') y = 500
  @type('string') anim = 'adam_idle_down'
  @type('boolean') readyToConnect = false
}

export class OfficeState extends Schema implements IOfficeState {
  @type({ map: Player })
  players = new MapSchema<Player>()

  @type({ map: Computer })
  computers = new MapSchema<Computer>()

  @type({ map: Whiteboard })
  whiteboards = new MapSchema<Whiteboard>()
}

function getRoomId() {
  let result = ''
  const characters = 'abcdef0123456789'
  const charactersLength = characters.length
  for (let i = 0; i < 20; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength))
  }
  return result
}

function getEncryptionId() {
  let result = ''
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const charactersLength = characters.length
  for (let i = 0; i < 22; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength))
  }
  return result
}
