import fs from 'fs'
import path from 'path'

/**
 * Offices that outlive the room they run in.
 *
 * A disposable office exists only while someone is inside it, so its link dies
 * with it. An office given a lifetime keeps its *definition* here instead: the
 * room itself is still disposed once empty - an empty office should not cost a
 * process - and the next person to open the link recreates it from this record.
 *
 * The record is what makes the link safe. Whoever opens it supplies the room
 * options, so without a stored definition a visitor could recreate a private
 * office with no password on it. Anything already recorded wins over what the
 * client asks for.
 */
export interface OfficeRecord {
  slug: string
  name: string
  description: string
  /** bcrypt hash, or null when the office is open */
  passwordHash: string | null
  unlisted: boolean
  createdAt: number
  expiresAt: number
}

const STORE_PATH =
  process.env.OFFICE_STORE_PATH || path.join(process.cwd(), 'data', 'offices.json')

/** a slug is minted by the client, so the server decides what it will accept */
export const SLUG_PATTERN = /^[A-Za-z0-9_-]{16,64}$/

export const MAX_LIFETIME_DAYS = 90
const DAY_MS = 24 * 60 * 60 * 1000

export default class OfficeStore {
  private records = new Map<string, OfficeRecord>()
  private writing: Promise<void> = Promise.resolve()

  constructor(private storePath: string = STORE_PATH) {
    this.load()
  }

  private load() {
    try {
      const raw = fs.readFileSync(this.storePath, 'utf8')
      const parsed = JSON.parse(raw) as OfficeRecord[]
      if (!Array.isArray(parsed)) throw new Error('office store is not an array')

      for (const record of parsed) {
        if (record?.slug) this.records.set(record.slug, record)
      }
      this.prune()
      console.log(`[offices] loaded ${this.records.size} from ${this.storePath}`)
    } catch (error: any) {
      if (error?.code !== 'ENOENT') {
        // a corrupt store should not stop the server serving disposable rooms
        console.error(`[offices] could not read ${this.storePath}:`, error?.message)
      }
    }
  }

  /** drops anything past its lifetime; returns how many went */
  prune(now = Date.now()) {
    let removed = 0
    for (const [slug, record] of this.records) {
      if (record.expiresAt <= now) {
        this.records.delete(slug)
        removed++
      }
    }
    if (removed > 0) this.persist()
    return removed
  }

  get(slug: string, now = Date.now()) {
    const record = this.records.get(slug)
    if (!record) return null

    if (record.expiresAt <= now) {
      this.records.delete(slug)
      this.persist()
      return null
    }

    return record
  }

  put(record: OfficeRecord) {
    this.records.set(record.slug, record)
    this.persist()
    return record
  }

  get size() {
    return this.records.size
  }

  static expiryFor(lifetimeDays: number, now = Date.now()) {
    const days = Math.min(Math.max(Math.floor(lifetimeDays), 1), MAX_LIFETIME_DAYS)
    return now + days * DAY_MS
  }

  /**
   * Writes are serialised and go via a temp file, so a crash midway leaves the
   * previous store intact rather than a half-written one.
   */
  private persist() {
    const snapshot = JSON.stringify([...this.records.values()], null, 2)

    this.writing = this.writing
      .then(async () => {
        const directory = path.dirname(this.storePath)
        await fs.promises.mkdir(directory, { recursive: true })

        const temporary = `${this.storePath}.tmp`
        await fs.promises.writeFile(temporary, snapshot, 'utf8')
        await fs.promises.rename(temporary, this.storePath)
      })
      .catch((error) => {
        console.error('[offices] could not write the store:', error?.message)
      })
  }

  /** for tests: waits for the queued write to land */
  flush() {
    return this.writing
  }
}
