/**
 * The four hand-drawn characters share a skin ramp and an outline ramp; only
 * hair and clothing differ. So a new avatar is the original art with those
 * regions remapped - which keeps the walk cycles exactly as drawn, rather than
 * trying to generate 52 frames of animation from scratch.
 */
export type Region = 'skin' | 'outline' | 'face' | 'hair' | 'top' | 'bottom'

/** shared by every base character */
export const SKIN_KEYS = new Set(['255,203,176', '246,174,159', '246,151,132', '255,184,147'])
export const OUTLINE_KEYS = new Set(['58,58,80', '70,70,94', '86,89,114'])

/**
 * Bands of the 32x48 idle-down frame, used once to work out what each colour
 * is. Everything after that is matched by colour, so sitting and running poses
 * cannot confuse it. Eyes and blush live in the face band and are left alone.
 */
export function bandFor(y: number): Region {
  if (y < 18) return 'hair'
  if (y < 30) return 'face'
  if (y < 40) return 'top'
  return 'bottom'
}

export const key = (r: number, g: number, b: number) => `${r},${g},${b}`

/** deterministic, so every client draws the same avatar from a descriptor */
export function seededRandom(seed: number) {
  let state = (seed ^ 0x9e3779b9) >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** skin ramps, lightest first */
export const SKIN_RAMPS = [
  '#ffdbc4', '#f5cba7', '#e0ac7e', '#c68642', '#8d5524', '#5c3a21',
]

export const HAIR_COLOURS = [
  '#2b2118', '#4a3524', '#6b4b2f', '#8a5a34', '#a8703f',
  '#c98f4b', '#e0b566', '#d94f3d', '#7a3f8c', '#3f6f8c',
  '#2f7a5a', '#8c8c8c', '#d8d8d8',
]

export const CLOTHING_COLOURS = [
  '#3d5a80', '#2f6f5e', '#7a3f4f', '#8c5a2f', '#5a4a7a',
  '#3f7a8c', '#8c7a3f', '#4a4a5a', '#a34f5a', '#2f5a3f',
  '#6b6b7a', '#8c4f7a', '#c96b4f', '#4f8c6b',
]

export function hexToRgb(hex: string): [number, number, number] {
  const value = parseInt(hex.slice(1), 16)
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255]
}

/** keeps a remapped region shaded the way it was drawn */
export function shade(hex: string, factor: number): [number, number, number] {
  const [r, g, b] = hexToRgb(hex)
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)))
  return [clamp(r * factor), clamp(g * factor), clamp(b * factor)]
}
