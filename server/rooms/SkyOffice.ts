import { Room, Client, ServerError } from 'colyseus'
import { Dispatcher } from '@colyseus/command'
import { Player, OfficeState, Computer, Whiteboard } from './schema/OfficeState'
import { Message } from '../../types/Messages'
import { IWorkspaceJoinOptions } from '../../types/Rooms'
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
import {
  verifyToken,
  getJoinValidation,
  getSessionConfig,
  syncPresence,
  syncPresenceBatch,
  pushPositions,
  JoinValidation,
  PresenceUpdate,
} from '../services/backend'

// Position snapshot is pushed to room-service this often for proximity voice (§4.2);
// presence (persistence) is flushed on a slower cadence (§2 — never per movement frame).
const POSITION_PUSH_INTERVAL = 2000
const PRESENCE_FLUSH_INTERVAL = 30000

export class SkyOffice extends Room<OfficeState> {
  private dispatcher = new Dispatcher(this)
  private workspaceId!: number
  private name = ''
  // Colyseus keys on sessionId; the backend keys on userId. Bridge them for every backend call.
  private sessionToUser = new Map<string, number>()
  private latestPosition = new Map<number, { x: number; y: number }>()
  private positionTimer?: NodeJS.Timeout
  private presenceTimer?: NodeJS.Timeout

  async onCreate(options: IWorkspaceJoinOptions) {
    this.workspaceId = Number(options.workspaceId)
    this.setMetadata({ workspaceId: this.workspaceId })
    this.setState(new OfficeState())

    // Build interactive objects from the backend, not from hard-coded loops. Each Computer/
    // Whiteboard is keyed by its persisted MapObject.id; whiteboard roomId is persisted (§2).
    const config = await getSessionConfig(this.workspaceId)
    this.name = config.name
    this.setMetadata({ workspaceId: this.workspaceId, name: config.name })

    for (const obj of config.mapObjects) {
      if (!obj.isActive) continue
      const key = String(obj.id)
      if (obj.type === 'COMPUTER') {
        const computer = new Computer()
        computer.id = key
        this.state.computers.set(key, computer)
      } else if (obj.type === 'WHITEBOARD') {
        const whiteboard = new Whiteboard()
        whiteboard.id = key
        whiteboard.roomId = obj.roomId
        this.state.whiteboards.set(key, whiteboard)
      }
    }

    this.registerMessageHandlers()
    this.startBackendFlush()
  }

  private registerMessageHandlers() {
    this.onMessage(Message.CONNECT_TO_COMPUTER, (client, message: { computerId: string }) => {
      this.dispatcher.dispatch(new ComputerAddUserCommand(), {
        client,
        computerId: message.computerId,
      })
    })

    this.onMessage(Message.DISCONNECT_FROM_COMPUTER, (client, message: { computerId: string }) => {
      this.dispatcher.dispatch(new ComputerRemoveUserCommand(), {
        client,
        computerId: message.computerId,
      })
    })

    this.onMessage(Message.STOP_SCREEN_SHARE, (client, message: { computerId: string }) => {
      const computer = this.state.computers.get(message.computerId)
      computer?.connectedUser.forEach((id) => {
        this.clients.forEach((cli) => {
          if (cli.sessionId === id && cli.sessionId !== client.sessionId) {
            cli.send(Message.STOP_SCREEN_SHARE, client.sessionId)
          }
        })
      })
    })

    this.onMessage(Message.CONNECT_TO_WHITEBOARD, (client, message: { whiteboardId: string }) => {
      this.dispatcher.dispatch(new WhiteboardAddUserCommand(), {
        client,
        whiteboardId: message.whiteboardId,
      })
    })

    this.onMessage(Message.DISCONNECT_FROM_WHITEBOARD, (client, message: { whiteboardId: string }) => {
      this.dispatcher.dispatch(new WhiteboardRemoveUserCommand(), {
        client,
        whiteboardId: message.whiteboardId,
      })
    })

    // Live state is updated every frame, but the backend is NOT called per frame (§2): the latest
    // position is accumulated and flushed on a timer.
    this.onMessage(Message.UPDATE_PLAYER, (client, message: { x: number; y: number; anim: string }) => {
      this.dispatcher.dispatch(new PlayerUpdateCommand(), {
        client,
        x: message.x,
        y: message.y,
        anim: message.anim,
      })
      const userId = this.sessionToUser.get(client.sessionId)
      if (userId !== undefined) {
        this.latestPosition.set(userId, { x: message.x, y: message.y })
      }
    })

    this.onMessage(Message.UPDATE_PLAYER_NAME, (client, message: { name: string }) => {
      this.dispatcher.dispatch(new PlayerUpdateNameCommand(), {
        client,
        name: message.name,
      })
    })

    // Status change in-session → push to workspace-service presence (§2 status-change handler).
    this.onMessage(
      Message.UPDATE_PLAYER_STATUS,
      (client, message: { status?: string; statusEmoji?: string }) => {
        const userId = this.sessionToUser.get(client.sessionId)
        if (userId === undefined) return
        syncPresence(this.workspaceId, {
          userId,
          isOnline: true,
          status: message.status,
          statusEmoji: message.statusEmoji,
        })
      }
    )

    this.onMessage(Message.READY_TO_CONNECT, (client) => {
      const player = this.state.players.get(client.sessionId)
      if (player) player.readyToConnect = true
    })

    this.onMessage(Message.VIDEO_CONNECTED, (client) => {
      const player = this.state.players.get(client.sessionId)
      if (player) player.videoConnected = true
    })

    this.onMessage(Message.DISCONNECT_STREAM, (client, message: { clientId: string }) => {
      this.clients.forEach((cli) => {
        if (cli.sessionId === message.clientId) {
          cli.send(Message.DISCONNECT_STREAM, client.sessionId)
        }
      })
    })

    this.onMessage(Message.ADD_CHAT_MESSAGE, (client, message: { content: string }) => {
      this.dispatcher.dispatch(new ChatMessageUpdateCommand(), {
        client,
        content: message.content,
      })
      this.broadcast(
        Message.ADD_CHAT_MESSAGE,
        { clientId: client.sessionId, content: message.content },
        { except: client }
      )
    })
  }

  /**
   * Identity bridge (§1): verify the JWT (shared secret), then confirm an active desk in the
   * workspace. The validated desk identity becomes `auth`, available to onJoin.
   */
  async onAuth(client: Client, options: IWorkspaceJoinOptions): Promise<JoinValidation> {
    let userId: number
    try {
      userId = verifyToken(options.token).userId
    } catch (e) {
      throw new ServerError(401, 'Invalid or expired token')
    }

    const validation = await getJoinValidation(this.workspaceId, userId)
    if (!validation.allowed) {
      throw new ServerError(403, 'Not a member of this workspace')
    }
    return validation
  }

  onJoin(client: Client, _options: IWorkspaceJoinOptions, auth: JoinValidation) {
    const player = new Player()
    player.name = auth.fullName
    player.x = auth.spawnX
    player.y = auth.spawnY
    player.anim = `${auth.avatarCharacter.toLowerCase()}_idle_down`
    this.state.players.set(client.sessionId, player)

    this.sessionToUser.set(client.sessionId, auth.userId)
    this.latestPosition.set(auth.userId, { x: auth.spawnX, y: auth.spawnY })

    syncPresence(this.workspaceId, {
      userId: auth.userId,
      isOnline: true,
      positionX: auth.spawnX,
      positionY: auth.spawnY,
    })
    // The fork gets workspace/room info from REST, so it registers no SEND_ROOM_DATA handler;
    // sending it just logged "onMessage() not registered for type" on every join.
  }

  onLeave(client: Client, _consented: boolean) {
    const userId = this.sessionToUser.get(client.sessionId)
    if (userId !== undefined) {
      const pos = this.latestPosition.get(userId)
      // Persist the last known position on disconnect (§2).
      syncPresence(this.workspaceId, {
        userId,
        isOnline: false,
        positionX: pos?.x,
        positionY: pos?.y,
      })
      this.sessionToUser.delete(client.sessionId)
      this.latestPosition.delete(userId)
    }

    this.state.players.delete(client.sessionId)
    this.state.computers.forEach((computer) => computer.connectedUser.delete(client.sessionId))
    this.state.whiteboards.forEach((whiteboard) => whiteboard.connectedUser.delete(client.sessionId))
  }

  private startBackendFlush() {
    this.positionTimer = setInterval(() => {
      const positions = [...this.latestPosition.entries()].map(([userId, p]) => ({
        userId,
        x: p.x,
        y: p.y,
      }))
      pushPositions(this.workspaceId, positions)
    }, POSITION_PUSH_INTERVAL)

    this.presenceTimer = setInterval(() => {
      const updates: PresenceUpdate[] = [...this.latestPosition.entries()].map(([userId, p]) => ({
        userId,
        isOnline: true,
        positionX: p.x,
        positionY: p.y,
      }))
      syncPresenceBatch(this.workspaceId, updates)
    }, PRESENCE_FLUSH_INTERVAL)
  }

  onDispose() {
    if (this.positionTimer) clearInterval(this.positionTimer)
    if (this.presenceTimer) clearInterval(this.presenceTimer)
    console.log('workspace room', this.workspaceId, 'disposing...')
    this.dispatcher.stop()
  }
}
