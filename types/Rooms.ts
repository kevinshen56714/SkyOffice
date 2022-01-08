export enum RoomType {
  COLYSEUS_LOBBYROOM = 'colyseus-lobbyroom',
  LOBBY = 'lobby',
  PUBLIC = 'skyoffice',
  OFFICE = 'office',
}

export interface IRoomData {
  roomNumber: string | null
  name: string
  description: string
  password: string | null
  autoDispose: boolean
  playerName?: string
  playerTexture?: string
  enterX?: number
  enterY?: number
}
