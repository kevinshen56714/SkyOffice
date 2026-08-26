import Phaser from 'phaser'
import Game from './scenes/Game'
import Background from './scenes/Background'
import Bootstrap from './scenes/Bootstrap'

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'phaser-container',
  backgroundColor: '#93cbee',
  pixelArt: true, // Prevent pixel art from becoming blurred when scaled.
  scale: {
    mode: Phaser.Scale.ScaleModes.RESIZE,
    width: window.innerWidth,
    height: window.innerHeight,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  autoFocus: true,
  scene: [Bootstrap, Background, Game],
}

const phaserGame = new Phaser.Game(config)

// handy in the console while developing, but it exposes the scene graph and
// the live room connection, so it stays out of production builds
if (import.meta.env.DEV) {
  ;(window as any).game = phaserGame
}

export default phaserGame
