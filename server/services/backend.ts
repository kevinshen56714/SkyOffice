/**
 * Backend integration for the forked Colyseus server (see workspace-service/INTEGRATION.md §1–§4).
 *
 * SkyOffice as-shipped is standalone; this module is the bridge to the Virtual Office backend:
 *  - verifies the user-service JWT locally with the shared secret (HS256, via Node's crypto — no
 *    extra dependency) and reads the userId claim;
 *  - calls workspace-service's internal API (X-Internal-Token) for join validation, the room boot
 *    payload (session-config), and presence sync;
 *  - pushes avatar positions to room-service for proximity voice (§4.2).
 *
 * Config via env (with dev defaults matching the backend application.yml):
 *   WORKSPACE_SERVICE_URL, ROOM_SERVICE_URL, INTERNAL_API_TOKEN, JWT_SECRET
 */
import { createHmac, timingSafeEqual } from 'crypto'

// Node 18+ exposes a global fetch; reach it without a global type declaration to avoid clashing
// with whatever @types/node version is installed.
const httpFetch = (globalThis as any).fetch as (url: string, init?: any) => Promise<any>

const WORKSPACE_URL = process.env.WORKSPACE_SERVICE_URL || 'http://localhost:8087'
const ROOM_URL = process.env.ROOM_SERVICE_URL || 'http://localhost:8086'
const INTERNAL_TOKEN = process.env.INTERNAL_API_TOKEN || 'dev-internal-token'
const JWT_SECRET = process.env.JWT_SECRET || 'your-very-strong-secret-key-must-be-at-least-32-characters-long'

const internalHeaders = {
  'X-Internal-Token': INTERNAL_TOKEN,
  'Content-Type': 'application/json',
}

export interface JwtIdentity {
  email: string
  userId: number
}

function base64UrlDecode(input: string): Buffer {
  return Buffer.from(input.replace(/-/g, '+').replace(/_/g, '/'), 'base64')
}

/**
 * Verifies an HS256 JWT (signature + expiry) with the shared secret and returns its identity, or
 * throws. Pins the algorithm to HS256 to avoid algorithm-confusion attacks.
 */
export function verifyToken(token: string): JwtIdentity {
  const parts = token.split('.')
  if (parts.length !== 3) {
    throw new Error('malformed token')
  }
  const [headerB64, payloadB64, signatureB64] = parts

  const header = JSON.parse(base64UrlDecode(headerB64).toString('utf8'))
  if (header.alg !== 'HS256') {
    throw new Error(`unsupported token algorithm: ${header.alg}`)
  }

  const expected = createHmac('sha256', JWT_SECRET).update(`${headerB64}.${payloadB64}`).digest()
  const actual = base64UrlDecode(signatureB64)
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    throw new Error('invalid signature')
  }

  const payload = JSON.parse(base64UrlDecode(payloadB64).toString('utf8'))
  if (payload.exp && Date.now() >= payload.exp * 1000) {
    throw new Error('token expired')
  }
  if (payload.userId === undefined || payload.userId === null) {
    throw new Error('token is missing the userId claim')
  }
  return { email: payload.sub || '', userId: Number(payload.userId) }
}

export interface JoinValidation {
  userId: number
  workspaceId: number
  deskId: number
  fullName: string
  avatarCharacter: string // ADAM | ASH | LUCY | NANCY
  spawnX: number
  spawnY: number
  role: string
  allowed: boolean
}

export interface MapObjectDto {
  id: number
  type: string // COMPUTER | WHITEBOARD
  label: string
  positionX: number
  positionY: number
  roomId: string
  capacity: number
  isActive: boolean
}

export interface SessionConfig {
  workspaceId: number
  name: string
  layout: any
  desks: any[]
  mapObjects: MapObjectDto[]
}

/** Confirms an active desk and returns the desk identity for the sessionId↔userId mapping (§1). */
export async function getJoinValidation(workspaceId: number, userId: number): Promise<JoinValidation> {
  const res = await httpFetch(
    `${WORKSPACE_URL}/api/internal/workspace/${workspaceId}/join-validation/${userId}`,
    { headers: internalHeaders }
  )
  if (res.status === 403 || res.status === 404) {
    return { allowed: false } as JoinValidation
  }
  if (!res.ok) {
    throw new Error(`join-validation failed: HTTP ${res.status}`)
  }
  return (await res.json()) as JoinValidation
}

/** The full room boot payload: workspace metadata + layout + desks + interactive objects (§2). */
export async function getSessionConfig(workspaceId: number): Promise<SessionConfig> {
  const res = await httpFetch(
    `${WORKSPACE_URL}/api/internal/workspace/${workspaceId}/session-config`,
    { headers: internalHeaders }
  )
  if (!res.ok) {
    throw new Error(`session-config failed: HTTP ${res.status}`)
  }
  return (await res.json()) as SessionConfig
}

export interface PresenceUpdate {
  userId: number
  isOnline: boolean
  status?: string
  statusEmoji?: string
  positionX?: number
  positionY?: number
}

/** Fire-and-forget presence sync; a backend hiccup must never break the live session. */
export function syncPresence(workspaceId: number, update: PresenceUpdate): void {
  post(`${WORKSPACE_URL}/api/internal/workspace/${workspaceId}/presence`, update)
}

/** Throttled batch flush of accumulated presence/positions (§2 UPDATE_PLAYER handler). */
export function syncPresenceBatch(workspaceId: number, updates: PresenceUpdate[]): void {
  if (updates.length === 0) return
  post(`${WORKSPACE_URL}/api/internal/workspace/${workspaceId}/presence/batch`, { updates })
}

export interface PlayerPosition {
  userId: number
  x: number
  y: number
}

/** Pushes the workspace's avatar-position snapshot to room-service for proximity voice (§4.2). */
export function pushPositions(workspaceId: number, positions: PlayerPosition[]): void {
  post(`${ROOM_URL}/api/internal/workspace/${workspaceId}/positions`, { positions })
}

function post(url: string, body: unknown): void {
  httpFetch(url, { method: 'POST', headers: internalHeaders, body: JSON.stringify(body) }).catch(
    (err: unknown) => console.error(`backend POST ${url} failed:`, (err as Error).message)
  )
}
