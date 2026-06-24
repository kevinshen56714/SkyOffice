/**
 * Chat persistence via chat-service (workspace-service/INTEGRATION.md §5).
 *
 * SkyOffice keeps broadcasting chat live over Colyseus for low latency; this module adds the
 * persistence side: on entering a workspace it loads history from chat-service, and every message
 * the user sends is also stored there. All calls go through the API gateway (Bearer auth → the
 * gateway injects the trusted X-User-Id chat-service keys on), so no WebSocket/ticket handshake is
 * needed — Colyseus already delivers the live feed.
 */
import { API_BASE_URL, TOKEN } from './Api'

export interface PersistedMessage {
  id: string
  senderId: number
  content: string
  createdAt: string
}

interface Page<T> {
  content: T[]
}

interface Channel {
  id: string
}

let channelId: string | undefined

async function chatGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, { headers: { Authorization: `Bearer ${TOKEN}` } })
  if (!res.ok) throw new Error(`GET ${path} failed: HTTP ${res.status}`)
  return (await res.json()) as T
}

async function chatPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`POST ${path} failed: HTTP ${res.status}`)
  return (await res.json()) as T
}

/**
 * Resolves the workspace's chat channel (creating it if absent — e.g. for a seeded workspace whose
 * channel-provisioning event never fired) and returns its history, oldest message first.
 */
export async function initChat(workspaceId: number, userId: number): Promise<PersistedMessage[]> {
  channelId = await resolveOrCreateChannel(workspaceId, userId)
  if (!channelId) return []
  const page = await chatGet<Page<PersistedMessage>>(`/api/chat/channels/${channelId}/messages?limit=50`)
  return (page.content ?? []).slice().reverse()
}

/** Stores a message the user just sent. Best-effort — never blocks the live Colyseus bubble. */
export async function persistChatMessage(content: string): Promise<void> {
  if (!channelId) return
  try {
    await chatPost(`/api/chat/channels/${channelId}/messages`, { content })
  } catch (err) {
    console.error('failed to persist chat message', err)
  }
}

async function resolveOrCreateChannel(workspaceId: number, userId: number): Promise<string | undefined> {
  const page = await chatGet<Page<Channel>>(`/api/chat/channels?workspaceId=${workspaceId}&limit=1`)
  if (page.content?.length) return page.content[0].id
  const created = await chatPost<Channel>('/api/chat/channels', {
    name: 'general',
    workspaceId,
    members: [userId],
  })
  return created.id
}
