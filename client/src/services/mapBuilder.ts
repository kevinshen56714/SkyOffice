/**
 * Builds a Phaser tilemap at runtime from the workspace-service floorplan
 * (workspace-service/INTEGRATION.md §3, D2) instead of a bundled Tiled asset.
 *
 * The backend layout is normalized (tilesets + tile layers with a flat gid array + a per-layer
 * `collides` flag). This module converts it into the in-memory Tiled JSON document Phaser
 * understands, then registers it and assembles the map. Tileset images must already be loaded
 * (Phaser needs the textures present before `make.tilemap`) — use {@link queueTilesetLoads} first.
 */
import Phaser from 'phaser'
import { Layout } from './Api'

/** Converts the backend layout into a Tiled-format JSON object (Phaser's TILED_JSON input). */
export function layoutToTiledJSON(layout: Layout): object {
  return {
    type: 'map',
    version: 1,
    orientation: 'orthogonal',
    renderorder: 'right-down',
    infinite: false,
    width: layout.mapWidth,
    height: layout.mapHeight,
    tilewidth: layout.tileSize,
    tileheight: layout.tileSize,
    tilesets: layout.tilesets.map((ts) => ({
      name: ts.name,
      firstgid: ts.firstGid,
      image: ts.imageUrl,
      tilewidth: ts.tileWidth,
      tileheight: ts.tileHeight,
      columns: ts.columns,
      tilecount: ts.tileCount,
      imagewidth: ts.columns * ts.tileWidth,
      imageheight: Math.ceil(ts.tileCount / ts.columns) * ts.tileHeight,
      margin: 0,
      spacing: 0,
    })),
    layers: orderedLayers(layout).map((layer, index) => ({
      id: index + 1,
      type: 'tilelayer',
      name: layer.name,
      width: layout.mapWidth,
      height: layout.mapHeight,
      x: 0,
      y: 0,
      opacity: 1,
      visible: true,
      data: layer.data,
      // Carried so Phaser exposes it; collision is actually applied per layer in buildTilemap.
      properties: layer.collides ? [{ name: 'collides', type: 'bool', value: true }] : [],
    })),
  }
}

/** Queues the load of every tileset image referenced by the layout (idempotent per texture). */
export function queueTilesetLoads(scene: Phaser.Scene, layout: Layout): void {
  for (const ts of layout.tilesets) {
    if (!scene.textures.exists(ts.name)) {
      scene.load.image(ts.name, ts.imageUrl)
    }
  }
}

export interface BuiltMap {
  map: Phaser.Tilemaps.Tilemap
  /** Layers flagged `collides` — collide the player against these. */
  collisionLayers: Phaser.Tilemaps.TilemapLayer[]
}

/**
 * Assembles the tilemap from the layout. Tileset textures must already be loaded
 * (see {@link queueTilesetLoads}). Returns the map plus the layers that should block movement.
 */
export function buildTilemap(scene: Phaser.Scene, layout: Layout, cacheKey = 'runtime-map'): BuiltMap {
  scene.cache.tilemap.remove(cacheKey)
  scene.cache.tilemap.add(cacheKey, {
    format: Phaser.Tilemaps.Formats.TILED_JSON,
    data: layoutToTiledJSON(layout),
  })
  const map = scene.make.tilemap({ key: cacheKey })

  for (const ts of layout.tilesets) {
    // Pass explicit tile size + firstgid; Phaser derives the grid from the real loaded texture,
    // so the backend's columns/tileCount need not match the image exactly.
    map.addTilesetImage(ts.name, ts.name, ts.tileWidth, ts.tileHeight, 0, 0, ts.firstGid)
  }
  const tilesetNames = layout.tilesets.map((ts) => ts.name)

  const collisionLayers: Phaser.Tilemaps.TilemapLayer[] = []
  for (const layerDef of orderedLayers(layout)) {
    const layer = map.createLayer(layerDef.name, tilesetNames, 0, 0)
    if (layer && layerDef.collides) {
      layer.setCollisionByExclusion([-1]) // every non-empty tile blocks movement
      collisionLayers.push(layer)
    }
  }

  return { map, collisionLayers }
}

function orderedLayers(layout: Layout) {
  return [...layout.layers].sort((a, b) => a.layerIndex - b.layerIndex)
}
