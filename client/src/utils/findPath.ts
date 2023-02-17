import Phaser from 'phaser'

interface TilePosition {
  x: number
  y: number
}

const toKey = (x: number, y: number) => `${x}x${y}`

const findPath = (
  start: Phaser.Math.Vector2,
  target: Phaser.Math.Vector2,
  groundLayer: Phaser.Tilemaps.TilemapLayer,
  wallsLayer: Phaser.Tilemaps.TilemapLayer
) => {
  // no path if select invalid tile
  if (!groundLayer.getTileAt(target.x, target.y)) {
    return []
  }

  // no path if select a wall
  if (wallsLayer.getTileAt(target.x, target.y)) {
    return []
  }

  const queue: TilePosition[] = []
  const parentForKey: { [key: string]: { key: string; position: TilePosition } } = {}

  const startKey = toKey(start.x, start.y)
  const targetKey = toKey(target.x, target.y)

  parentForKey[startKey] = {
    key: '',
    position: { x: -1, y: -1 },
  }

  queue.push(start)

  while (queue.length > 0) {
    const { x, y } = queue.shift()!
    const currentKey = toKey(x, y)

    if (currentKey === targetKey) {
      break
    }

    const neighbors = [
      { x, y: y - 1 }, // top
      { x: x + 1, y }, // right
      { x, y: y + 1 }, // bottom
      { x: x - 1, y }, // left
    ]

    for (let i = 0; i < neighbors.length; ++i) {
      const neighbor = neighbors[i]
      const tile = groundLayer.getTileAt(neighbor.x, neighbor.y)

      if (!tile) {
        continue
      }

      if (wallsLayer.getTileAt(neighbor.x, neighbor.y)) {
        continue
      }

      const key = toKey(neighbor.x, neighbor.y)

      if (key in parentForKey) {
        continue
      }

      parentForKey[key] = {
        key: currentKey,
        position: { x, y },
      }

      queue.push(neighbor)
    }
  }

  const path: Phaser.Math.Vector2[] = []

  let currentKey = targetKey
  let currentPos = parentForKey[targetKey].position

  while (currentKey !== startKey) {
    const pos = groundLayer.tileToWorldXY(currentPos.x, currentPos.y)
    pos.x += groundLayer.tilemap.tileWidth * 0.5
    pos.y += groundLayer.tilemap.tileHeight * 0.5

    path.push(pos)

    const { key, position } = parentForKey[currentKey]
    currentKey = key
    currentPos = position
  }

  return path.reverse()
}

export default findPath
