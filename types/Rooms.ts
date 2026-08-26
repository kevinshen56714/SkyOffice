export enum RoomType {
  LOBBY = 'lobby',
  PUBLIC = 'skyoffice',
  CUSTOM = 'custom',
}

export interface IRoomData {
  name: string
  description: string
  password: string | null
  /** keep the room out of the lobby listing; joinable by id only */
  unlisted: boolean
  /**
   * Stable id for an office meant to outlive the room. Absent for a disposable
   * office, which lives only while someone is inside it.
   */
  slug?: string
  /** how long the slug keeps working; ignored without a slug */
  lifetimeDays?: number
}

/** offered when creating an office */
export const OFFICE_LIFETIMES = [
  { days: 0, label: 'Until everyone leaves' },
  { days: 1, label: '1 day' },
  { days: 7, label: '7 days' },
  { days: 30, label: '30 days' },
]
