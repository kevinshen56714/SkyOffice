import Phaser from 'phaser'

export const debugDraw = (layer: Phaser.Tilemaps.TilemapLayer, scene: Phaser.Scene) => {
  const debugGraphics = scene.add.graphics().setAlpha(0.7)
  layer.renderDebug(debugGraphics, {
    tileColor: new Phaser.Display.Color(150, 0, 0, 150),
    collidingTileColor: new Phaser.Display.Color(243, 234, 48, 255),
    faceColor: new Phaser.Display.Color(40, 39, 37, 255),
  })
}
