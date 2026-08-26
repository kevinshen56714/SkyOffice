import { PeerOptions } from 'peerjs'
import { peerHost, peerPath, peerPort, peerSecure } from '../runtimeConfig'

/**
 * With no options PeerJS uses its free public broker, which means signalling
 * metadata for every call leaves our infrastructure, availability depends on a
 * service we do not run, and peer ids share a namespace with every other app
 * using the default - so an id can be reached from outside the room.
 *
 * Point VITE_PEER_HOST at a self-hosted PeerServer to avoid all three. Unset,
 * behaviour is unchanged.
 */
export function peerOptions(): PeerOptions | undefined {
  const host = peerHost()

  if (!host) return undefined

  const port = Number(peerPort())
  const secure = peerSecure() !== 'false'

  return {
    host,
    path: peerPath() || '/',
    secure,
    ...(Number.isFinite(port) && port > 0 ? { port } : {}),
  }
}
