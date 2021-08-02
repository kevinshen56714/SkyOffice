import { Schema, MapSchema, Context, type } from '@colyseus/schema'
import { IPlayer, IOfficeState } from '../../../types/IOfficeState'

export class Player extends Schema implements IPlayer {
  @type('number') x = 705
  @type('number') y = 500
  @type('string') anim = 'player_idle_down'
}

export class OfficeState extends Schema implements IOfficeState {
  @type({ map: Player })
  players = new MapSchema<Player>()
}
