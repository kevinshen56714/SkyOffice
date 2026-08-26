import fs from 'fs'
import path from 'path'

/**
 * The client builds its items straight out of the Tiled map, keyed by the order
 * they appear in the object layer. The server reads the same file so that the
 * two agree on how many items exist and where they are, instead of both sides
 * hard-coding counts that silently drift apart.
 */

export interface ItemBox {
  /** center of the item, matching how the client positions the sprite */
  x: number
  y: number
  halfWidth: number
  halfHeight: number
}

export interface MapBounds {
  width: number
  height: number
}

interface TiledObject {
  x: number
  y: number
  width: number
  height: number
}

interface TiledLayer {
  name: string
  type: string
  objects?: TiledObject[]
}

interface TiledMap {
  width: number
  height: number
  tilewidth: number
  tileheight: number
  layers: TiledLayer[]
}

const MAP_RELATIVE_PATH = path.join('client', 'public', 'assets', 'map', 'map.json')

/**
 * Walk up from this module until the client's map turns up. Keeps working for
 * both `ts-node-dev` out of ./server and the compiled build under ./server/lib.
 */
function findMapFile(): string {
  let dir = __dirname

  for (let i = 0; i < 8; i++) {
    const candidate = path.join(dir, MAP_RELATIVE_PATH)
    if (fs.existsSync(candidate)) return candidate

    const parent = path.dirname(dir)
    if (parent === dir) break
    dir = parent
  }

  throw new Error(
    `Unable to locate ${MAP_RELATIVE_PATH} starting from ${__dirname}. ` +
      'The server reads the Tiled map to place items and validate player positions.'
  )
}

function readObjectLayer(map: TiledMap, layerName: string): ItemBox[] {
  const layer = map.layers.find((l) => l.name === layerName && l.type === 'objectgroup')

  if (!layer || !layer.objects) {
    throw new Error(`Object layer "${layerName}" is missing from the Tiled map.`)
  }

  // Tiled anchors tile objects at their bottom-left corner - same math the
  // client uses in Game.addObjectFromTiled()
  return layer.objects.map((object) => ({
    x: object.x + object.width * 0.5,
    y: object.y - object.height * 0.5,
    halfWidth: object.width * 0.5,
    halfHeight: object.height * 0.5,
  }))
}

const map: TiledMap = JSON.parse(fs.readFileSync(findMapFile(), 'utf8'))

export const mapBounds: MapBounds = {
  width: map.width * map.tilewidth,
  height: map.height * map.tileheight,
}

export const computerBoxes = readObjectLayer(map, 'Computer')
export const whiteboardBoxes = readObjectLayer(map, 'Whiteboard')

/**
 * How far outside an item's own footprint a player may stand and still interact
 * with it. Two tiles is comfortably more than the reach the client's item
 * selector allows, while still far smaller than the distance between two
 * different items - so a player cannot connect to an item across the map.
 */
const INTERACTION_MARGIN = 64

export function isWithinReach(box: ItemBox | undefined, x: number, y: number) {
  if (!box) return false

  return (
    Math.abs(x - box.x) <= box.halfWidth + INTERACTION_MARGIN &&
    Math.abs(y - box.y) <= box.halfHeight + INTERACTION_MARGIN
  )
}
