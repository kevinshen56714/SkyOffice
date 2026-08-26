/**
 * A room is shared as a link carrying its id, so opening it drops you straight
 * into that office instead of the room list. Rooms are disposed once empty, so
 * a link is an invitation to join now rather than a permanent address.
 */
const ROOM_PARAM = 'room'
const OFFICE_PARAM = 'office'

/**
 * An office given a lifetime is shared by its slug, which keeps working after
 * the room is disposed. A disposable office can only be shared by room id,
 * which dies with it.
 */
export function buildShareLink(roomId: string, slug?: string | null) {
  const url = new URL(window.location.href)
  url.hash = ''
  url.search = ''
  if (slug) url.searchParams.set(OFFICE_PARAM, slug)
  else url.searchParams.set(ROOM_PARAM, roomId)
  return url.toString()
}

/** what someone was invited to, if they arrived through a share link */
export function inviteFromUrl(): { kind: 'office' | 'room'; id: string } | null {
  const params = new URLSearchParams(window.location.search)

  const slug = params.get(OFFICE_PARAM)
  if (slug && slug.trim()) return { kind: 'office', id: slug.trim() }

  const roomId = params.get(ROOM_PARAM)
  if (roomId && roomId.trim()) return { kind: 'room', id: roomId.trim() }

  return null
}

/** generates the stable id for an office that should outlive its room */
export function newOfficeSlug() {
  const bytes = new Uint8Array(12)
  crypto.getRandomValues(bytes)
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Drops the invite out of the address bar once it has been used, so a later
 * refresh lands on the room list rather than retrying a room that has since
 * been disposed.
 */
export function forgetShareLink() {
  const url = new URL(window.location.href)
  if (!url.searchParams.has(ROOM_PARAM) && !url.searchParams.has(OFFICE_PARAM)) return

  url.searchParams.delete(ROOM_PARAM)
  url.searchParams.delete(OFFICE_PARAM)
  window.history.replaceState({}, '', url.pathname + url.search + url.hash)
}
