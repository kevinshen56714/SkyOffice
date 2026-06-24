/**
 * Thin Agora media adapter for proximity/zone voice (workspace-service/INTEGRATION.md §4).
 *
 * room-service decides which Agora channel an avatar should be in and signals it; this adapter
 * just joins/leaves that channel and publishes the microphone, subscribing to peers' audio. v1 is
 * App-ID-only (no server token), matching room-service. Verifying real audio needs an Agora app-id
 * and the live stack — but the join/leave reconciliation here is driven entirely by the backend.
 */
import AgoraRTC, { IAgoraRTCClient, IMicrophoneAudioTrack } from 'agora-rtc-sdk-ng'

export default class AgoraVoice {
  private client?: IAgoraRTCClient
  private micTrack?: IMicrophoneAudioTrack
  private currentChannel: string | null = null

  /** Reconcile to the backend-assigned channel: no-op if unchanged, else leave then (re)join. */
  async setChannel(appId: string, channel: string | null, uid: number): Promise<void> {
    if (channel === this.currentChannel) return
    await this.leave()
    if (!channel) return

    const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' })
    client.on('user-published', async (user, mediaType) => {
      if (mediaType === 'audio') {
        await client.subscribe(user, 'audio')
        user.audioTrack?.play()
      }
    })

    // v1: App-ID-only, so the token is null (room-service mints no server token yet).
    await client.join(appId, channel, null, uid)
    this.micTrack = await AgoraRTC.createMicrophoneAudioTrack()
    await client.publish([this.micTrack])

    this.client = client
    this.currentChannel = channel
  }

  async leave(): Promise<void> {
    if (this.micTrack) {
      this.micTrack.stop()
      this.micTrack.close()
      this.micTrack = undefined
    }
    if (this.client) {
      await this.client.leave()
      this.client = undefined
    }
    this.currentChannel = null
  }
}
