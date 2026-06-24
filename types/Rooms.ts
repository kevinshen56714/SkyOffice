export enum RoomType {
  LOBBY = 'lobby',
  PUBLIC = 'skyoffice',
  CUSTOM = 'custom',
  // One room per Virtual Office workspace (INTEGRATION.md §0.1, §2). Joined with a JWT + workspaceId;
  // the workspace's id is used as the Colyseus filter so a workspace always shares a single room.
  WORKSPACE = 'workspace',
}

export interface IRoomData {
  name: string
  description: string
  password: string | null
  autoDispose: boolean
}

/** Join options the forked client sends to enter its workspace room (INTEGRATION.md §1). */
export interface IWorkspaceJoinOptions {
  token: string
  workspaceId: number
}
