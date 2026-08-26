/**
 * Vite inlines `import.meta.env` at build time, so a containerised client would
 * otherwise need rebuilding for every deployment. The image writes /config.js
 * from its environment when the container starts, which lets the same image be
 * pointed at any server from the Portainer stack settings.
 *
 * Build-time VITE_* values still work and are used when nothing is set at
 * runtime, so `yarn dev` and any static build are unaffected.
 */
export interface RuntimeConfig {
  serverUrl?: string
  peerHost?: string
  peerPort?: string
  peerPath?: string
  peerSecure?: string
}

declare global {
  interface Window {
    __SKYOFFICE_CONFIG__?: RuntimeConfig
  }
}

function fromRuntime(key: keyof RuntimeConfig) {
  const value = window.__SKYOFFICE_CONFIG__?.[key]
  // unset variables come through as empty strings from envsubst
  return value && value.trim() ? value.trim() : undefined
}

function setting(key: keyof RuntimeConfig, buildTimeValue: string | undefined) {
  return fromRuntime(key) || (buildTimeValue && buildTimeValue.trim()) || undefined
}

export function serverUrl() {
  return setting('serverUrl', import.meta.env.VITE_SERVER_URL)
}

export function peerHost() {
  return setting('peerHost', import.meta.env.VITE_PEER_HOST)
}

export function peerPort() {
  return setting('peerPort', import.meta.env.VITE_PEER_PORT)
}

export function peerPath() {
  return setting('peerPath', import.meta.env.VITE_PEER_PATH)
}

export function peerSecure() {
  return setting('peerSecure', import.meta.env.VITE_PEER_SECURE)
}
