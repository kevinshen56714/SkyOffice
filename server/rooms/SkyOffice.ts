import { IncomingMessage } from 'http'
import bcrypt from 'bcrypt'
import { Room, Client, ServerError } from 'colyseus'
import { Dispatcher } from '@colyseus/command'
import { Player, OfficeState, Computer, Whiteboard } from './schema/OfficeState'
import { Message } from '../../types/Messages'
import { IRoomData, RoomType } from '../../types/Rooms'
import RateLimiter from './RateLimiter'
import { computerBoxes, whiteboardBoxes, mapBounds, isWithinReach, ItemBox } from './MapObjects'
import PlayerUpdateCommand from './commands/PlayerUpdateCommand'
import PlayerUpdateNameCommand from './commands/PlayerUpdateNameCommand'
import {
  ComputerAddUserCommand,
  ComputerRemoveUserCommand,
} from './commands/ComputerUpdateArrayCommand'
import {
  WhiteboardAddUserCommand,
  WhiteboardRemoveUserCommand,
} from './commands/WhiteboardUpdateArrayCommand'
import ChatMessageUpdateCommand from './commands/ChatMessageUpdateCommand'
import { isAvatar } from '../../types/Avatar'
import OfficeStore, { SLUG_PATTERN } from './OfficeStore'

/** one store for the process; offices outlive the rooms that run them */
export const officeStore = new OfficeStore()

const MAX_NAME_LENGTH = 32
const MAX_CHAT_LENGTH = 500
const MAX_ANIM_LENGTH = 64
const MAX_ROOM_NAME_LENGTH = 64
const MAX_ROOM_DESCRIPTION_LENGTH = 2000

/** the client sends a position on every frame it moves, so ~60/s is normal */
const MOVEMENT_PER_SECOND = 120
const MOVEMENT_BURST = 240

/**
 * How much ground a player is allowed to cover. The client walks at 200 px/s,
 * so the budget refills at three times that to leave room for latency and for
 * updates arriving in bursts. The capacity is what can be spent at once: large
 * enough for the one legitimate jump in the game - sitting snaps the player
 * onto the chair - and far short of the distance between two items.
 */
const MOVEMENT_REFILL_PX_PER_SECOND = 600
const MOVEMENT_BUDGET_PX = 150
const CHAT_PER_SECOND = 0.5
const CHAT_BURST = 5
/** five quick tries at a room password, then one a minute */
const PASSWORD_ATTEMPTS_PER_SECOND = 1 / 60
const PASSWORD_ATTEMPT_BURST = 5

/** best effort origin for throttling; a reverse proxy puts the real ip here */
function clientAddress(request?: IncomingMessage) {
  const forwarded = request?.headers['x-forwarded-for']
  const first = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0]
  return first?.trim() || request?.socket?.remoteAddress || 'unknown'
}

export class SkyOffice extends Room<OfficeState> {
  private dispatcher = new Dispatcher(this)
  private name: string
  private description: string
  private password: string | null = null
  private slug: string | null = null
  private movementLimiter = new RateLimiter(MOVEMENT_BURST, MOVEMENT_PER_SECOND)
  private movementBudget = new RateLimiter(MOVEMENT_BUDGET_PX, MOVEMENT_REFILL_PX_PER_SECOND)
  private chatLimiter = new RateLimiter(CHAT_BURST, CHAT_PER_SECOND)
  private passwordLimiter = new RateLimiter(PASSWORD_ATTEMPT_BURST, PASSWORD_ATTEMPTS_PER_SECOND)

  async onCreate(options: IRoomData) {
    // A client must not be able to keep a room resident forever by asking for
    // it, so an empty room is always disposed - including an office with a
    // lifetime, whose definition lives in the store rather than in memory.
    // Only the public lobby, which the server defines itself, stays alive.
    this.autoDispose = this.roomName !== RoomType.PUBLIC

    const settings = await this.resolveSettings(options)
    this.slug = settings.slug

    this.name = settings.name
    this.description = settings.description
    this.password = settings.passwordHash

    // A password stops people joining, but the lobby listing still published
    // the name, description and occupancy of every custom room. Unlisted rooms
    // stay out of it and are reachable by id only.
    if (settings.unlisted) await this.setPrivate(true)

    this.setMetadata({
      name: this.name,
      description: this.description,
      hasPassword: settings.passwordHash !== null,
    })

    this.setState(new OfficeState())

    // items come from the same Tiled map the client renders, so the ids on both
    // sides always line up
    computerBoxes.forEach((_, index) => {
      this.state.computers.set(String(index), new Computer())
    })

    whiteboardBoxes.forEach((_, index) => {
      this.state.whiteboards.set(String(index), new Whiteboard())
    })

    // when a player connect to a computer, add to the computer connectedUser array
    this.onSafeMessage(Message.CONNECT_TO_COMPUTER, (client, message: { computerId: string }) => {
      const computerId = this.readItemId(message?.computerId, computerBoxes.length)
      if (computerId === null) return
      if (!this.isPlayerNearItem(client, computerBoxes[Number(computerId)])) return

      this.dispatcher.dispatch(new ComputerAddUserCommand(), { client, computerId })
    })

    // when a player disconnect from a computer, remove from the computer connectedUser array
    this.onSafeMessage(
      Message.DISCONNECT_FROM_COMPUTER,
      (client, message: { computerId: string }) => {
        const computerId = this.readItemId(message?.computerId, computerBoxes.length)
        if (computerId === null) return

        this.dispatcher.dispatch(new ComputerRemoveUserCommand(), { client, computerId })
      }
    )

    // when a player stop sharing screen
    this.onSafeMessage(Message.STOP_SCREEN_SHARE, (client, message: { computerId: string }) => {
      const computerId = this.readItemId(message?.computerId, computerBoxes.length)
      if (computerId === null) return

      const computer = this.state.computers.get(computerId)
      if (!computer) return

      computer.connectedUser.forEach((id) => {
        this.clients.forEach((cli) => {
          if (cli.sessionId === id && cli.sessionId !== client.sessionId) {
            cli.send(Message.STOP_SCREEN_SHARE, client.sessionId)
          }
        })
      })
    })

    // when a player connect to a whiteboard, add to the whiteboard connectedUser array
    this.onSafeMessage(
      Message.CONNECT_TO_WHITEBOARD,
      (client, message: { whiteboardId: string }) => {
        const whiteboardId = this.readItemId(message?.whiteboardId, whiteboardBoxes.length)
        if (whiteboardId === null) return
        if (!this.isPlayerNearItem(client, whiteboardBoxes[Number(whiteboardId)])) return

        this.dispatcher.dispatch(new WhiteboardAddUserCommand(), { client, whiteboardId })
      }
    )

    // when a player disconnect from a whiteboard, remove from the whiteboard connectedUser array
    this.onSafeMessage(
      Message.DISCONNECT_FROM_WHITEBOARD,
      (client, message: { whiteboardId: string }) => {
        const whiteboardId = this.readItemId(message?.whiteboardId, whiteboardBoxes.length)
        if (whiteboardId === null) return

        this.dispatcher.dispatch(new WhiteboardRemoveUserCommand(), { client, whiteboardId })
      }
    )

    // when receiving updatePlayer message, call the PlayerUpdateCommand
    this.onSafeMessage(
      Message.UPDATE_PLAYER,
      (client, message: { x: number; y: number; anim: string }) => {
        const x = this.readCoordinate(message?.x, mapBounds.width)
        const y = this.readCoordinate(message?.y, mapBounds.height)
        if (x === null || y === null) return
        if (typeof message.anim !== 'string' || message.anim.length > MAX_ANIM_LENGTH) return
        if (!this.movementLimiter.consume(client.sessionId)) return

        const step = this.affordableStep(client.sessionId, x, y)
        if (!step) return

        this.dispatcher.dispatch(new PlayerUpdateCommand(), {
          client,
          x: step.x,
          y: step.y,
          anim: message.anim,
        })
      }
    )

    // when receiving updatePlayerName message, call the PlayerUpdateNameCommand
    this.onSafeMessage(Message.UPDATE_PLAYER_NAME, (client, message: { name: string }) => {
      if (typeof message?.name !== 'string') return

      this.dispatcher.dispatch(new PlayerUpdateNameCommand(), {
        client,
        name: message.name.slice(0, MAX_NAME_LENGTH),
      })
    })

    // the avatar is generated from this on every client, so only the
    // descriptor travels - and only if it is one we recognise
    this.onSafeMessage(Message.UPDATE_PLAYER_AVATAR, (client, message: { avatar: string }) => {
      if (!isAvatar(message?.avatar)) return

      const player = this.state.players.get(client.sessionId)
      if (player) player.avatar = message.avatar
    })

    // when a player is ready to connect, call the PlayerReadyToConnectCommand
    this.onSafeMessage(Message.READY_TO_CONNECT, (client) => {
      const player = this.state.players.get(client.sessionId)
      if (player) player.readyToConnect = true
    })

    // when a player is ready to connect, call the PlayerReadyToConnectCommand
    this.onSafeMessage(Message.VIDEO_CONNECTED, (client) => {
      const player = this.state.players.get(client.sessionId)
      if (player) player.videoConnected = true
    })

    // when a player disconnect a stream, broadcast the signal to the other player connected to the stream
    this.onSafeMessage(Message.DISCONNECT_STREAM, (client, message: { clientId: string }) => {
      if (typeof message?.clientId !== 'string') return

      this.clients.forEach((cli) => {
        if (cli.sessionId === message.clientId) {
          cli.send(Message.DISCONNECT_STREAM, client.sessionId)
        }
      })
    })

    // when a player send a chat message, update the message array and broadcast to all connected clients except the sender
    this.onSafeMessage(Message.ADD_CHAT_MESSAGE, (client, message: { content: string }) => {
      if (typeof message?.content !== 'string') return
      if (!this.chatLimiter.consume(client.sessionId)) return

      const content = message.content.slice(0, MAX_CHAT_LENGTH)

      // update the message array (so that players join later can also see the message)
      this.dispatcher.dispatch(new ChatMessageUpdateCommand(), { client, content })

      // broadcast to all currently connected clients except the sender (to render in-game dialog on top of the character)
      this.broadcast(
        Message.ADD_CHAT_MESSAGE,
        { clientId: client.sessionId, content },
        { except: client }
      )
    })
  }

  /**
   * An office with a slug is meant to outlive the room, so its settings come
   * from the store rather than from whoever happened to open the link. Without
   * that, a visitor reopening a private office would recreate it with no
   * password, quietly making it public.
   */
  private async resolveSettings(options: IRoomData) {
    const slug = typeof options?.slug === 'string' ? options.slug : null

    if (slug) {
      if (!SLUG_PATTERN.test(slug)) {
        throw new ServerError(400, 'That office link is not valid.')
      }

      const existing = officeStore.get(slug)
      if (existing) {
        // reopening: the recorded settings win over anything supplied now
        return {
          slug,
          name: existing.name,
          description: existing.description,
          passwordHash: existing.passwordHash,
          unlisted: existing.unlisted,
        }
      }

      // Creating one is deliberate, and carries a lifetime. Opening a link to
      // an office that has expired or never existed must not quietly mint an
      // empty one under that slug.
      const lifetimeDays = Number(options?.lifetimeDays)
      if (!Number.isFinite(lifetimeDays) || lifetimeDays < 1) {
        throw new ServerError(404, 'That office has closed.')
      }

      const settings = await this.settingsFromOptions(options)
      officeStore.put({
        slug,
        name: settings.name,
        description: settings.description,
        passwordHash: settings.passwordHash,
        unlisted: settings.unlisted,
        createdAt: Date.now(),
        expiresAt: OfficeStore.expiryFor(lifetimeDays),
      })

      return { ...settings, slug }
    }

    return { ...(await this.settingsFromOptions(options)), slug: null }
  }

  private async settingsFromOptions(options: IRoomData) {
    const name = (options?.name ?? '').slice(0, MAX_ROOM_NAME_LENGTH)
    const description = (options?.description ?? '').slice(0, MAX_ROOM_DESCRIPTION_LENGTH)

    let passwordHash: string | null = null
    if (options?.password) {
      const salt = await bcrypt.genSalt(10)
      passwordHash = await bcrypt.hash(String(options.password), salt)
    }

    return { name, description, passwordHash, unlisted: Boolean(options?.unlisted) }
  }

  /**
   * Colyseus does not wrap message handlers, so an exception raised while
   * handling one message would otherwise escape to the socket layer and take
   * the whole process down - every other room included.
   */
  private onSafeMessage<T>(type: Message, handler: (client: Client, message: T) => void) {
    this.onMessage(type, (client: Client, message: T) => {
      try {
        handler(client, message)
      } catch (error) {
        console.error(
          `[SkyOffice] failed to handle ${Message[type]} from ${client.sessionId}:`,
          error
        )
      }
    })
  }

  /** returns the id when it names a real item, null otherwise */
  private readItemId(value: unknown, itemCount: number) {
    if (typeof value !== 'string') return null

    const index = Number(value)
    if (!Number.isInteger(index) || index < 0 || index >= itemCount) return null

    return value
  }

  /**
   * Checking the map bounds alone let a client claim any position on it, so it
   * could teleport next to a computer and then pass the proximity check
   * honestly. A player may now only cover ground they could plausibly have
   * walked.
   *
   * A step that costs more than the budget is trimmed towards where the client
   * asked to be, rather than dropped. Dropping would be simpler, but a player
   * whose real position had run ahead of the server would then never be able to
   * move again - and this has to hold for movement the server has never seen,
   * so it degrades to lagging behind instead of wedging.
   */
  private affordableStep(sessionId: string, x: number, y: number) {
    const player = this.state.players.get(sessionId)
    if (!player) return null

    const dx = x - player.x
    const dy = y - player.y
    const distance = Math.hypot(dx, dy)
    if (distance === 0) return { x, y }

    const affordable = this.movementBudget.takeUpTo(sessionId, distance)
    if (affordable >= distance) return { x, y }

    const ratio = affordable / distance
    return { x: player.x + dx * ratio, y: player.y + dy * ratio }
  }

  private readCoordinate(value: unknown, limit: number) {
    if (typeof value !== 'number' || !Number.isFinite(value)) return null
    if (value < 0 || value > limit) return null

    return value
  }

  /**
   * Screen shares and whiteboards are handed to whoever is connected to the
   * item, so connecting has to be gated on actually standing next to it -
   * otherwise any client can subscribe to every item in the room at once.
   */
  private isPlayerNearItem(client: Client, box: ItemBox) {
    const player = this.state.players.get(client.sessionId)
    if (!player) return false

    return isWithinReach(box, player.x, player.y)
  }

  async onAuth(client: Client, options: { password: string | null }, request?: IncomingMessage) {
    if (this.password) {
      const origin = clientAddress(request)

      // Checked before the compare: bcrypt at cost 10 is deliberately slow, so
      // an unthrottled guessing loop is both a brute force and a cheap way to
      // burn our CPU.
      if (!this.passwordLimiter.check(origin)) {
        throw new ServerError(429, 'Too many attempts, please try again later.')
      }

      if (typeof options?.password !== 'string') {
        this.passwordLimiter.consume(origin)
        throw new ServerError(403, 'Password is incorrect!')
      }

      const validPassword = await bcrypt.compare(options.password, this.password)
      if (!validPassword) {
        // only a wrong guess costs allowance, so honest users are never limited
        this.passwordLimiter.consume(origin)
        throw new ServerError(403, 'Password is incorrect!')
      }
    }
    return true
  }

  onJoin(client: Client, options: any) {
    this.state.players.set(client.sessionId, new Player())
    client.send(Message.SEND_ROOM_DATA, {
      id: this.roomId,
      name: this.name,
      description: this.description,
      // present only for an office meant to outlive this room
      slug: this.slug,
    })
  }

  onLeave(client: Client, consented: boolean) {
    this.movementLimiter.forget(client.sessionId)
    this.movementBudget.forget(client.sessionId)
    this.chatLimiter.forget(client.sessionId)

    if (this.state.players.has(client.sessionId)) {
      this.state.players.delete(client.sessionId)
    }
    this.state.computers.forEach((computer) => {
      if (computer.connectedUser.has(client.sessionId)) {
        computer.connectedUser.delete(client.sessionId)
      }
    })
    this.state.whiteboards.forEach((whiteboard) => {
      if (whiteboard.connectedUser.has(client.sessionId)) {
        whiteboard.connectedUser.delete(client.sessionId)
      }
    })
  }

  onDispose() {
    console.log('room', this.roomId, 'disposing...')
    this.dispatcher.stop()
  }
}
