/**
 * Boots a real server in-process and drives it with a real client. Covers the
 * things a client should not be able to do - the findings from the security
 * audit - so they cannot quietly come back.
 *
 * Run with: yarn test
 */
process.env.PORT = process.env.TEST_PORT || '2599'
// so the matchmaking origin gate is active for the checks below
process.env.ALLOWED_ORIGINS = 'http://allowed.example.test'
// keep the office store out of the working tree
process.env.OFFICE_STORE_PATH = require('path').join(require('os').tmpdir(), 'skyoffice-test-offices.json')
try { require('fs').unlinkSync(process.env.OFFICE_STORE_PATH) } catch {}

require('../index')

import { Client } from 'colyseus.js'
import { Message } from '../../types/Messages'
import { computerBoxes } from '../rooms/MapObjects'
import RateLimiter from '../rooms/RateLimiter'
import http from 'http'

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const positionOf = (room: any) => room.state.players.get(room.sessionId)
const distance = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y)

/**
 * The server only lets a player cover ground at a plausible speed, so arriving
 * somewhere takes real time. Asking repeatedly to be at the destination walks
 * them there a budget at a time.
 */
async function walkTo(room: any, target: { x: number; y: number }) {
  for (let step = 0; step < 40; step++) {
    room.send(Message.UPDATE_PLAYER, { x: target.x, y: target.y, anim: 'adam_idle_down' })
    await sleep(100)
    if (distance(positionOf(room), target) < 1) return true
  }
  return false
}
const endpoint = `ws://localhost:${process.env.PORT}`

let failures = 0
function check(label: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  if (!ok) failures++
  console.log(
    `${ok ? '  ok  ' : ' FAIL '} ${label}` +
      (ok ? '' : `\n         got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)}`)
  )
}

function rateLimiterUnits() {
  console.log('\nRateLimiter')
  const limiter = new RateLimiter(5, 1)

  let allowed = 0
  for (let i = 0; i < 20; i++) if (limiter.consume('a', 1000)) allowed++
  check('a burst is capped at the bucket capacity', allowed, 5)
  check('allowance comes back over time', limiter.consume('a', 3000), true)
  check('keys are independent', limiter.consume('b', 1000), true)
  check('check() does not spend allowance', [limiter.check('c', 0), limiter.consume('c', 0)], [true, true])

  const budget = new RateLimiter(150, 600)
  check('takeUpTo spends what it can', budget.takeUpTo('m', 400, 0), 150)
  check('and leaves nothing behind', budget.takeUpTo('m', 10, 0), 0)
  check('it refills at its own rate', budget.takeUpTo('m', 400, 100), 60)
}

/** POSTs a matchmaking request, optionally as a browser would, and reports the status */
function matchmakeStatus(origin?: string) {
  return new Promise<number>((resolve, reject) => {
    const request = http.request(
      {
        host: '127.0.0.1',
        port: Number(process.env.PORT),
        path: '/matchmake/joinOrCreate/skyoffice',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(origin ? { Origin: origin } : {}),
        },
      },
      (response) => {
        response.resume()
        response.on('end', () => resolve(response.statusCode || 0))
      }
    )
    request.on('error', reject)
    request.end('{}')
  })
}

async function matchmakingOriginTests() {
  console.log('\nMatchmaking origins')

  // Colyseus answers /matchmake/* on the raw http server, before express and its
  // cors middleware see it, so this has to be enforced in front of Colyseus.
  check('an allowed origin gets through', await matchmakeStatus('http://allowed.example.test'), 200)
  check('another site is refused', await matchmakeStatus('http://evil.example.test'), 403)
  // CORS only ever protected browsers; anything else can omit the header
  check('a request with no origin still works', await matchmakeStatus(undefined), 200)
}

function slug() {
  return require('crypto').randomBytes(12).toString('hex')
}

async function officeLifetimeTests() {
  console.log('\nOffices with a lifetime')
  const client = new Client(endpoint)

  // a disposable office dies with its room
  const throwaway = await client.create('custom', {
    name: 'Throwaway', description: 'd', password: null, unlisted: false,
  })
  const throwawayId = throwaway.id
  await throwaway.leave()
  await sleep(900)
  let gone = false
  try { await client.joinById(throwawayId) } catch { gone = true }
  check('a disposable office is gone once empty', gone, true)

  // an office with a lifetime comes back from its slug
  const officeSlug = slug()
  const kept = await client.create('custom', {
    name: 'Design Team', description: 'kept', password: null, unlisted: true,
    slug: officeSlug, lifetimeDays: 7,
  })
  await kept.leave()
  await sleep(900)

  const reopened = await client.joinOrCreate('custom', { slug: officeSlug })
  await sleep(300)
  check('an office with a lifetime reopens from its slug', (reopened.state as any) !== undefined, true)
  const listed = await client.getAvailableRooms('custom')
  check('and is still unlisted after reopening', listed.some((r) => r.roomId === reopened.id), false)
  await reopened.leave()
  await sleep(900)

  // the important one: reopening must not drop the password
  const lockedSlug = slug()
  const locked = await client.create('custom', {
    name: 'Board Room', description: 'private', password: 'hunter2', unlisted: true,
    slug: lockedSlug, lifetimeDays: 7,
  })
  await locked.leave()
  await sleep(900)

  let hijacked = false
  try {
    // a visitor reopening it supplies no password at all
    const stolen = await client.joinOrCreate('custom', { slug: lockedSlug })
    hijacked = true
    await stolen.leave()
  } catch { /* refused, which is the point */ }
  check('reopening a private office still demands its password', hijacked, false)

  const withPassword = await client.joinOrCreate('custom', { slug: lockedSlug, password: 'hunter2' })
  check('and the real password still opens it', typeof withPassword.id === 'string', true)
  await withPassword.leave()

  // a slug nobody has claimed must not mint an office
  let invented = false
  try {
    const ghost = await client.joinOrCreate('custom', { slug: slug() })
    invented = true
    await ghost.leave()
  } catch { /* refused */ }
  check('an unknown office link does not create one', invented, false)

  let malformed = false
  try {
    const bad = await client.joinOrCreate('custom', { slug: 'no', lifetimeDays: 7 })
    malformed = true
    await bad.leave()
  } catch { /* refused */ }
  check('a malformed slug is refused', malformed, false)
}

async function roomTests() {
  const client = new Client(endpoint)

  console.log('\nMalformed messages')
  const room = await client.joinOrCreate('skyoffice')
  await sleep(300)

  room.send(Message.STOP_SCREEN_SHARE, { computerId: '999' })
  room.send(Message.DISCONNECT_FROM_COMPUTER, { computerId: '999' })
  room.send(Message.DISCONNECT_FROM_WHITEBOARD, { whiteboardId: 'nope' })
  room.send(Message.CONNECT_TO_COMPUTER, { computerId: { evil: true } })
  room.send(Message.STOP_SCREEN_SHARE, null)
  room.send(Message.UPDATE_PLAYER, { x: 'NaN', y: null, anim: 7 })
  await sleep(300)
  room.send(Message.UPDATE_PLAYER_NAME, { name: 'still-alive' })
  await sleep(400)
  check(
    'an unknown item id does not take the room down',
    (room.state as any).players.get(room.sessionId).name,
    'still-alive'
  )

  console.log('\nItem proximity')
  const near = computerBoxes[0]
  const far = computerBoxes[3]
  const connectedTo = (id: string) => (room.state as any).computers.get(id)?.connectedUser.size

  // the spawn point is nowhere near a computer
  room.send(Message.CONNECT_TO_COMPUTER, { computerId: '0' })
  await sleep(350)
  check('a computer across the room is refused', connectedTo('0'), 0)

  check('walking to a computer arrives', await walkTo(room, near), true)
  room.send(Message.CONNECT_TO_COMPUTER, { computerId: '0' })
  await sleep(350)
  check('the computer being stood at is allowed', connectedTo('0'), 1)

  console.log('\nMovement')
  // The real client sends a position every frame it moves, ~3px at a time. That
  // must never be trimmed, or the budget would make ordinary walking stutter.
  const walkFrom = { x: positionOf(room).x, y: positionOf(room).y }
  let asked = walkFrom.x
  for (let frame = 0; frame < 60; frame++) {
    asked = Math.max(0, asked - 200 / 60)
    room.send(Message.UPDATE_PLAYER, { x: asked, y: walkFrom.y, anim: 'adam_run_left' })
    await sleep(16)
  }
  await sleep(200)
  const covered = walkFrom.x - positionOf(room).x
  check('ordinary frame-by-frame walking is never trimmed', covered >= (walkFrom.x - asked) * 0.95, true)

  // one jump straight at a computer on the other side of the room.
  // positionOf returns the live schema object, so these have to be snapshots.
  const jumpFrom = { x: positionOf(room).x, y: positionOf(room).y }
  room.send(Message.UPDATE_PLAYER, { x: far.x, y: far.y, anim: 'adam_idle_down' })
  await sleep(300)
  const jumpTo = { x: positionOf(room).x, y: positionOf(room).y }

  check('a teleport does not arrive', distance(jumpTo, far) > 1, true)
  check('a teleport is trimmed to the movement budget', distance(jumpTo, jumpFrom) <= 200, true)

  room.send(Message.CONNECT_TO_COMPUTER, { computerId: '3' })
  await sleep(350)
  check('so it does not get you into that computer either', connectedTo('3'), 0)

  console.log('\nInput limits')
  const heldAt = { x: positionOf(room).x, y: positionOf(room).y }
  room.send(Message.UPDATE_PLAYER, { x: 999999, y: 999999, anim: 'adam_idle_down' })
  await sleep(250)
  check('a position outside the map is dropped', positionOf(room).x, heldAt.x)

  room.send(Message.UPDATE_PLAYER_NAME, { name: 'x'.repeat(5000) })
  await sleep(300)
  check('player name is capped', (room.state as any).players.get(room.sessionId).name.length, 32)

  const before = (room.state as any).chatMessages.length
  for (let i = 0; i < 25; i++) room.send(Message.ADD_CHAT_MESSAGE, { content: `flood ${i}` })
  await sleep(700)
  const stored = (room.state as any).chatMessages.length - before
  check('a chat flood is cut to the burst size', stored >= 5 && stored <= 8, true)

  console.log('\nWhiteboard ids')
  const ids = [...(room.state as any).whiteboards.values()].map((w: any) => w.roomId)
  check('are 128 bits of base64url', ids.every((id: string) => /^[A-Za-z0-9_-]{22}$/.test(id)), true)
  check('are all distinct', new Set(ids).size, ids.length)

  const publicId = room.id
  await room.leave()

  console.log('\nRoom lifetime')
  await sleep(700)
  const publicAgain = await client.joinOrCreate('skyoffice')
  check('the public lobby survives being empty', publicAgain.id, publicId)
  await publicAgain.leave()

  const temp = await client.create('custom', { name: 'temp', description: 'temp', password: null, unlisted: false })
  const tempId = temp.id
  await temp.leave()
  await sleep(900)
  let disposed = false
  try {
    await client.joinById(tempId)
  } catch {
    disposed = true
  }
  check('a custom room is disposed once empty', disposed, true)

  console.log('\nRoom creation')
  const big = await client.create('custom', {
    name: 'n'.repeat(500),
    description: 'd'.repeat(9000),
    password: null,
    unlisted: false,
  })
  await sleep(300)
  const listed = (await client.getAvailableRooms('custom')).find((r) => r.roomId === big.id)
  check('room name is capped', (listed?.metadata as any)?.name.length, 64)
  check('room description is capped', (listed?.metadata as any)?.description.length, 2000)
  await big.leave()

  const hidden = await client.create('custom', {
    name: 'hidden',
    description: 'hidden',
    password: null,
    unlisted: true,
  })
  await sleep(400)
  const rooms = await client.getAvailableRooms('custom')
  check('an unlisted room is not listed', rooms.some((r) => r.roomId === hidden.id), false)
  const rejoined = await client.joinById(hidden.id)
  check('an unlisted room is still joinable by id', rejoined.id, hidden.id)
  await rejoined.leave()
  await hidden.leave()

  console.log('\nRoom passwords')
  const locked = await client.create('custom', {
    name: 'private',
    description: 'p',
    password: 'correct-horse',
    unlisted: false,
  })
  await sleep(300)
  const codes: number[] = []
  for (let i = 0; i < 7; i++) {
    try {
      await client.joinById(locked.id, { password: `wrong-${i}` })
    } catch (error: any) {
      codes.push(error.code)
    }
  }
  check('wrong passwords are rejected', codes.slice(0, 5).every((code) => code === 403), true)
  check('guessing is throttled after the burst', codes.slice(5).every((code) => code === 429), true)
  await locked.leave()
}

async function main() {
  rateLimiterUnits()
  await sleep(700)
  await matchmakingOriginTests()
  await officeLifetimeTests()
  await roomTests()

  console.log(failures === 0 ? '\nall checks passed' : `\n${failures} check(s) failed`)
  process.exit(failures === 0 ? 0 : 1)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
