import Phaser from 'phaser'

export const createCharacterAnims = (anims: Phaser.Animations.AnimationManager) => {
  const animsFrameRate = 15

  anims.create({
    key: 'player_idle_right',
    frames: anims.generateFrameNames('player', {
      start: 1,
      end: 6,
      prefix: 'Adam_idle_anim_',
      suffix: '.png',
    }),
    repeat: -1,
    frameRate: animsFrameRate * 0.6,
  })

  anims.create({
    key: 'player_idle_up',
    frames: anims.generateFrameNames('player', {
      start: 7,
      end: 12,
      prefix: 'Adam_idle_anim_',
      suffix: '.png',
    }),
    repeat: -1,
    frameRate: animsFrameRate * 0.6,
  })

  anims.create({
    key: 'player_idle_left',
    frames: anims.generateFrameNames('player', {
      start: 13,
      end: 18,
      prefix: 'Adam_idle_anim_',
      suffix: '.png',
    }),
    repeat: -1,
    frameRate: animsFrameRate * 0.6,
  })

  anims.create({
    key: 'player_idle_down',
    frames: anims.generateFrameNames('player', {
      start: 19,
      end: 24,
      prefix: 'Adam_idle_anim_',
      suffix: '.png',
    }),
    repeat: -1,
    frameRate: animsFrameRate * 0.6,
  })

  anims.create({
    key: 'player_run_right',
    frames: anims.generateFrameNames('player', {
      start: 1,
      end: 6,
      prefix: 'Adam_run_',
      suffix: '.png',
    }),
    repeat: -1,
    frameRate: animsFrameRate,
  })

  anims.create({
    key: 'player_run_up',
    frames: anims.generateFrameNames('player', {
      start: 7,
      end: 12,
      prefix: 'Adam_run_',
      suffix: '.png',
    }),
    repeat: -1,
    frameRate: animsFrameRate,
  })

  anims.create({
    key: 'player_run_left',
    frames: anims.generateFrameNames('player', {
      start: 13,
      end: 18,
      prefix: 'Adam_run_',
      suffix: '.png',
    }),
    repeat: -1,
    frameRate: animsFrameRate,
  })

  anims.create({
    key: 'player_run_down',
    frames: anims.generateFrameNames('player', {
      start: 19,
      end: 24,
      prefix: 'Adam_run_',
      suffix: '.png',
    }),
    repeat: -1,
    frameRate: animsFrameRate,
  })
}
