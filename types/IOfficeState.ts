import { Schema, ArraySchema, SetSchema, MapSchema } from '@colyseus/schema'

// 勤務状態の型定義
export type WorkStatus = 'working' | 'break' | 'meeting' | 'overtime' | 'off-duty'

// 外観の型定義
export type ClothingType = 'business' | 'casual' | 'tired'
export type AccessoryType = 'coffee' | 'documents' | 'none'

export interface IPlayerAppearance {
    clothing: ClothingType
    accessory: AccessoryType
}

export interface IPlayer extends Schema {
  name: string
  x: number
  y: number
  anim: string
  readyToConnect: boolean
  videoConnected: boolean
  workStatus: WorkStatus
  workStartTime: number
  lastBreakTime: number
  fatigueLevel: number
  appearance: IPlayerAppearance
}

export interface IComputer extends Schema {
  connectedUser: SetSchema<string>
}

export interface IWhiteboard extends Schema {
  roomId: string
  connectedUser: SetSchema<string>
}

export interface IChatMessage extends Schema {
  author: string
  createdAt: number
  content: string
}

export interface IMeetingRoomChatMessage extends Schema {
  author: string
  createdAt: number
  content: string
  meetingRoomId: string
  messageId: string
}
export interface IMeetingRoom {
    id: string
    name: string
    mode: 'open' | 'private' | 'secret'
    hostUserId: string
    invitedUsers: string[]
    participants: string[]
}

export interface IMeetingRoomArea {
    meetingRoomId: string
    x: number
    y: number
    width: number
    height: number
}

export interface IMeetingRoomState {
    meetingRooms: MapSchema<IMeetingRoom>
    meetingRoomAreas: MapSchema<IMeetingRoomArea>
  meetingRoomChatMessages: ArraySchema<IMeetingRoomChatMessage>
}

export interface IOfficeState extends Schema {
  players: MapSchema<IPlayer>
  computers: MapSchema<IComputer>
  whiteboards: MapSchema<IWhiteboard>
  chatMessages: ArraySchema<IChatMessage>
  meetingRoomState: IMeetingRoomState
}
