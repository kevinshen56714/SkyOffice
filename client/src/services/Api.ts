/**
 * Backend REST client for the forked SkyOffice client (workspace-service/INTEGRATION.md §3).
 *
 * The client is entered with a JWT + workspaceId taken from the URL query string — the website
 * (user-service login + workspace pick) redirects here with `?token=…&workspaceId=…`. For local
 * development they fall back to Vite env vars. Every call goes through the API gateway, which
 * validates the token and injects the trusted identity headers downstream.
 */

const params = new URLSearchParams(window.location.search)

/** Gateway base URL (the gateway routes /api/workspace, /api/chat, /api/rooms to the services). */
export const API_BASE_URL: string = import.meta.env.VITE_API_URL || 'http://localhost:8080'

/** The signed user-service JWT (carries the userId claim the backend keys on). */
export const TOKEN: string = params.get('token') || import.meta.env.VITE_DEMO_TOKEN || ''

/** The workspace to enter. */
export const WORKSPACE_ID: number = Number(
  params.get('workspaceId') || import.meta.env.VITE_DEMO_WORKSPACE_ID || 0
)

export function hasCredentials(): boolean {
  return TOKEN !== '' && WORKSPACE_ID > 0
}

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  })
  if (!res.ok) {
    throw new ApiError(res.status, `GET ${path} failed: HTTP ${res.status}`)
  }
  return (await res.json()) as T
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

// ── Response shapes (subset of the workspace-service DTOs the client consumes) ─────────────────

export interface LayoutTileset {
  name: string
  imageUrl: string
  firstGid: number
  tileWidth: number
  tileHeight: number
  columns: number
  tileCount: number
}

export interface LayoutLayer {
  name: string
  layerIndex: number
  collides: boolean
  data: number[] // row-major gids, length = mapWidth * mapHeight
}

export interface LayoutZone {
  type: string // MEETING_ROOM | FOCUS_AREA | SOCIAL | TEAM | OPEN
  name: string
  x: number
  y: number
  width: number
  height: number
  voiceRoomId: string | null
  proximityRadius: number | null
}

export interface LayoutSpawnPoint {
  x: number
  y: number
  label: string | null
  isDefault: boolean
}

export interface Layout {
  workspaceId: number
  tileSize: number
  mapWidth: number
  mapHeight: number
  layoutVersion: number
  tilesets: LayoutTileset[]
  layers: LayoutLayer[]
  zones: LayoutZone[]
  spawnPoints: LayoutSpawnPoint[]
}

export interface MapObject {
  id: number
  type: string // COMPUTER | WHITEBOARD
  label: string
  positionX: number
  positionY: number
  roomId: string
  capacity: number
  isActive: boolean
}

export interface MyDesk {
  id: number
  userId: number
  fullName: string
  avatarCharacter: string // ADAM | ASH | LUCY | NANCY
  positionX: number
  positionY: number
  role: string
}

/** The full floorplan: tiles, tilesets, zones, spawn points (INTEGRATION.md §3, D2). */
export async function getLayout(workspaceId: number): Promise<Layout> {
  const layout = await apiGet<Layout>(`/api/workspace/${workspaceId}/layout`)
  // The backend serialises each layer's gid array as a JSON string; Phaser's tilemap needs a real
  // number[]. Without this the string is consumed char-by-char as gids and the floor renders as
  // garbage (the ASCII codes of "[412, 412, ...]").
  for (const layer of layout.layers) {
    if (typeof (layer.data as unknown) === 'string') {
      layer.data = JSON.parse(layer.data as unknown as string)
    }
  }
  return layout
}

/** Interactive objects — computers and whiteboards — with positions and stable roomIds. */
export function getMapObjects(workspaceId: number): Promise<MapObject[]> {
  return apiGet<MapObject[]>(`/api/workspace/${workspaceId}/map-objects`)
}

/** The caller's own desk: spawn point, avatar, and name (replaces the typed login dialog). */
export function getMyDesk(workspaceId: number): Promise<MyDesk> {
  return apiGet<MyDesk>(`/api/workspace/${workspaceId}/desks/me`)
}
