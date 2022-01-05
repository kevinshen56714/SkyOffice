import Phaser from 'phaser'

export const createItemAnims = (anims: Phaser.Animations.AnimationManager) => {
  const animsFrameRate = 15

  anims.create({
    key: 'escalator_up',
    frames: anims.generateFrameNames('escalator', {
      start: 0,
      end: 5,
    }),
    repeat: -1,
    frameRate: animsFrameRate * 0.75,
  })

  anims.create({
    key: 'escalator_down',
    frames: anims.generateFrameNames('escalator', {
      start: 5,
      end: 0,
    }),
    repeat: -1,
    frameRate: animsFrameRate * 0.75,
  })
}
