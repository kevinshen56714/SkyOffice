/**
 * Proximity/zone voice signaling (workspace-service/INTEGRATION.md §4.3).
 *
 * room-service computes voice groups from avatar positions and broadcasts VOICE_GROUP_CHANGED over
 * STOMP. This service subscribes to that feed and, whenever this user's assigned Agora channel
 * changes, tells the {@link AgoraVoice} adapter to switch — so walking toward someone joins their
 * ad-hoc channel, and stepping into a meeting room joins its private one.
 *
 * The ws-ticket is fetched through the gateway (Bearer); the STOMP socket connects directly to
 * room-service (the gateway does not route /ws/rooms), configurable via VITE_ROOM_WS_URL.
 */
import { Client } from '@stomp/stompjs'
import { API_BASE_URL, TOKEN } from './Api'
import AgoraVoice from './AgoraVoice'

const ROOM_WS_URL = import.meta.env.VITE_ROOM_WS_URL || 'ws://localhost:8086'
const ROOM_WS_ENDPOINT = '/ws/rooms'
// Must match room-service's room.agora.app-id; dev default is the demo app id.
const AGORA_APP_ID = import.meta.env.VITE_AGORA_APP_ID || '5db80389fc284a3a8c166979882f118d'

interface VoiceGroupChange {
  userId: number
  channel: string | null
  peers: number[]
}

export default class VoiceService {
  private client?: Client
  private agora = new AgoraVoice()
  private myUserId = 0

  async connect(workspaceId: number, myUserId: number): Promise<void> {
    this.myUserId = myUserId
    const ticket = await this.fetchTicket()

    const client = new Client({
      brokerURL: `${ROOM_WS_URL}${ROOM_WS_ENDPOINT}?ticket=${encodeURIComponent(ticket)}`,
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe(`/topic/workspace/${workspaceId}/voice`, (frame) =>
          this.onVoiceEvent(frame.body)
        )
      },
    })
    client.activate()
    this.client = client
  }

  disconnect(): void {
    this.client?.deactivate()
    this.agora.leave().catch(() => undefined)
  }

  private onVoiceEvent(body: string): void {
    let event: { action: string; payload: VoiceGroupChange[] }
    try {
      event = JSON.parse(body)
    } catch {
      return
    }
    if (event.action !== 'VOICE_GROUP_CHANGED' || !Array.isArray(event.payload)) return

    const mine = event.payload.find((change) => change.userId === this.myUserId)
    if (!mine) return // this user's channel did not change

    this.agora
      .setChannel(AGORA_APP_ID, mine.channel, this.myUserId)
      .catch((err) => console.error('voice channel switch failed', err))
  }

  private async fetchTicket(): Promise<string> {
    const res = await fetch(`${API_BASE_URL}/api/rooms/ws-ticket`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${TOKEN}` },
    })
    if (!res.ok) throw new Error(`room ws-ticket failed: HTTP ${res.status}`)
    return ((await res.json()) as { ticket: string }).ticket
  }
}
