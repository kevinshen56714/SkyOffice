import Phaser from 'phaser'
import {
  AvatarDescriptor,
  avatarTextureKey,
  genderOf,
  seedOf,
} from '../../../types/Avatar'
import {
  CLOTHING_COLOURS,
  HAIR_COLOURS,
  OUTLINE_KEYS,
  Region,
  SKIN_KEYS,
  SKIN_RAMPS,
  bandFor,
  key,
  seededRandom,
  shade,
} from './palette'

/** the drawn characters, split by how they read */
const BASES: Record<string, string[]> = {
  m: ['adam', 'ash'],
  f: ['lucy', 'nancy'],
  n: ['adam', 'ash', 'lucy', 'nancy'],
}

const FRAME_WIDTH = 32
const FRAME_HEIGHT = 48
/** the frame the classification is read from: idle, facing the camera */
const REFERENCE_FRAME = 18

type Classification = Map<string, Region>

const classifications = new Map<string, Classification>()

/**
 * Works out what each colour in a base sprite is, by looking at where it falls
 * in one known frame. Done once per base character; every other frame is then
 * remapped purely by colour, so poses cannot mislead it.
 */
function classify(scene: Phaser.Scene, base: string): Classification {
  const cached = classifications.get(base)
  if (cached) return cached

  const source = scene.textures.get(base).getSourceImage() as HTMLImageElement
  const canvas = document.createElement('canvas')
  canvas.width = source.width
  canvas.height = source.height
  const context = canvas.getContext('2d', { willReadFrequently: true })!
  context.drawImage(source, 0, 0)

  const tally = new Map<string, Record<Region, number>>()
  const frame = context.getImageData(REFERENCE_FRAME * FRAME_WIDTH, 0, FRAME_WIDTH, FRAME_HEIGHT)

  for (let y = 0; y < FRAME_HEIGHT; y++) {
    for (let x = 0; x < FRAME_WIDTH; x++) {
      const i = (y * FRAME_WIDTH + x) * 4
      if (frame.data[i + 3] < 128) continue

      const colour = key(frame.data[i], frame.data[i + 1], frame.data[i + 2])
      if (SKIN_KEYS.has(colour) || OUTLINE_KEYS.has(colour)) continue

      const band = bandFor(y)
      const counts =
        tally.get(colour) || ({ skin: 0, outline: 0, face: 0, hair: 0, top: 0, bottom: 0 } as Record<Region, number>)
      counts[band]++
      tally.set(colour, counts)
    }
  }

  const result: Classification = new Map()
  for (const [colour, counts] of tally) {
    const [region] = (Object.entries(counts) as [Region, number][]).sort((a, b) => b[1] - a[1])[0]
    result.set(colour, region)
  }

  classifications.set(base, result)
  return result
}

/** the colours this descriptor resolves to; shared by the sprite and the portrait */
export function avatarColours(avatar: AvatarDescriptor) {
  const random = seededRandom(seedOf(avatar))
  const pick = <T>(list: T[]) => list[Math.floor(random() * list.length)]

  const bases = BASES[genderOf(avatar)] || BASES.n
  return {
    base: bases[Math.floor(random() * bases.length)],
    skin: pick(SKIN_RAMPS),
    hair: pick(HAIR_COLOURS),
    top: pick(CLOTHING_COLOURS),
    bottom: pick(CLOTHING_COLOURS),
  }
}

/**
 * Builds the avatar's spritesheet and animations if they do not exist yet.
 * Deterministic, so a player arriving on any client produces the same sprite.
 */
export function ensureAvatarTexture(scene: Phaser.Scene, avatar: AvatarDescriptor) {
  const textureKey = avatarTextureKey(avatar)
  if (scene.textures.exists(textureKey)) return textureKey

  const colours = avatarColours(avatar)
  const regions = classify(scene, colours.base)

  const source = scene.textures.get(colours.base).getSourceImage() as HTMLImageElement
  const canvas = document.createElement('canvas')
  canvas.width = source.width
  canvas.height = source.height
  const context = canvas.getContext('2d', { willReadFrequently: true })!
  context.drawImage(source, 0, 0)

  const image = context.getImageData(0, 0, canvas.width, canvas.height)
  const data = image.data

  // one entry per source colour, so the remap is a lookup rather than a decision
  const remap = new Map<string, [number, number, number]>()
  const skinRamp = [...SKIN_KEYS]
  skinRamp.forEach((colour, index) => {
    // the ramp runs light to dark; keep the same relative shading
    remap.set(colour, shade(colours.skin, [1, 0.88, 0.78, 0.83][index] ?? 1))
  })

  for (const [colour, region] of regions) {
    if (region === 'face') continue // eyes and blush stay as drawn

    const target = region === 'hair' ? colours.hair : region === 'top' ? colours.top : colours.bottom
    // shade by how bright the original colour was, so highlights stay highlights
    const [r, g, b] = colour.split(',').map(Number)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    remap.set(colour, shade(target, 0.65 + luminance * 0.7))
  }

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue

    const replacement = remap.get(key(data[i], data[i + 1], data[i + 2]))
    if (!replacement) continue

    data[i] = replacement[0]
    data[i + 1] = replacement[1]
    data[i + 2] = replacement[2]
  }

  context.putImageData(image, 0, 0)
  scene.textures.addSpriteSheet(textureKey, canvas as unknown as HTMLImageElement, {
    frameWidth: FRAME_WIDTH,
    frameHeight: FRAME_HEIGHT,
  })

  createAvatarAnims(scene, textureKey)
  return textureKey
}

/** the same twelve animations the drawn characters have */
function createAvatarAnims(scene: Phaser.Scene, textureKey: string) {
  const frameRate = 15
  const directions = ['right', 'up', 'left', 'down']

  directions.forEach((direction, index) => {
    scene.anims.create({
      key: `${textureKey}_idle_${direction}`,
      frames: scene.anims.generateFrameNumbers(textureKey, {
        start: index * 6,
        end: index * 6 + 5,
      }),
      repeat: -1,
      frameRate: frameRate * 0.6,
    })

    scene.anims.create({
      key: `${textureKey}_run_${direction}`,
      frames: scene.anims.generateFrameNumbers(textureKey, {
        start: 24 + index * 6,
        end: 24 + index * 6 + 5,
      }),
      repeat: -1,
      frameRate,
    })

    scene.anims.create({
      key: `${textureKey}_sit_${direction}`,
      frames: scene.anims.generateFrameNumbers(textureKey, {
        start: 48 + index,
        end: 48 + index,
      }),
      repeat: 0,
      frameRate,
      })
  })
}
