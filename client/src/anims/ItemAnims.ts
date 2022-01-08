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
    frameRate: animsFrameRate * 0.7,
  })

  anims.create({
    key: 'escalator_down',
    frames: anims.generateFrameNames('escalator', {
      start: 6,
      end: 11,
    }),
    repeat: -1,
    frameRate: animsFrameRate * 0.7,
  })

  anims.create({
    key: 'receptionist_0',
    frames: anims.generateFrameNames('receptionist', {
      start: 0,
      end: 6,
    }),
    repeat: -1,
    frameRate: animsFrameRate * 0.4,
  })

  anims.create({
    key: 'receptionist_1',
    frames: anims.generateFrameNames('receptionist', {
      start: 13,
      end: 7,
    }),
    repeat: -1,
    frameRate: animsFrameRate * 0.6,
  })
}
