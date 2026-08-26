const SCREEN_SHARE_SUFFIX = '-ss'

/**
 * PeerJS ids have to be alphanumeric, but Colyseus session ids come from an
 * alphabet that includes - and _. The old approach rewrote every invalid
 * character to the letter G, which quietly collapsed distinct session ids onto
 * the same peer id. Hex is reversible, so two sessions can never collide.
 *
 * Session ids are ASCII, so two hex digits per character is exact.
 */
export function toPeerId(sessionId: string) {
  let peerId = ''
  for (let i = 0; i < sessionId.length; i++) {
    peerId += sessionId.charCodeAt(i).toString(16).padStart(2, '0')
  }
  return peerId
}

export function toScreenSharePeerId(sessionId: string) {
  return `${toPeerId(sessionId)}${SCREEN_SHARE_SUFFIX}`
}

/** collapses either flavour of peer id onto one key */
export function basePeerId(peerId: string) {
  return peerId.endsWith(SCREEN_SHARE_SUFFIX)
    ? peerId.slice(0, -SCREEN_SHARE_SUFFIX.length)
    : peerId
}

const colorArr = [
  '#7bf1a8',
  '#ff7e50',
  '#9acd32',
  '#daa520',
  '#ff69b4',
  '#c085f6',
  '#1e90ff',
  '#5f9da0',
]

// determine name color by first character charCode
export function getColorByString(string: string) {
  // an empty or missing name used to index the palette with NaN and come back
  // undefined - the login dialog hits this before room data arrives
  if (!string) return colorArr[0]

  return colorArr[string.charCodeAt(0) % colorArr.length]
}

export function getAvatarString(name: string) {
  if (!name) return ''

  // a leading space used to make part[0] empty and render "undefinedB"
  const parts = name.split(' ').filter(Boolean)
  if (parts.length === 0) return ''

  return parts.length < 2 ? parts[0][0] : parts[0][0] + parts[1][0]
}

/** 'lucy_idle_down' -> 'lucy' */
export function textureFromAnim(anim: string) {
  const texture = anim?.split('_')[0]
  return texture || 'adam'
}
