import Phaser from 'phaser'

export const createCharacterAnims = (anims: Phaser.Animations.AnimationManager) => {
  const animsFrameRate = 15

  anims.create({
    key: 'nancy_idle_right',
    frames: anims.generateFrameNames('nancy', {
      start: 0,
      end: 5,
    }),
    repeat: -1,
    frameRate: animsFrameRate * 0.6,
  })

  anims.create({
    key: 'nancy_idle_up',
    frames: anims.generateFrameNames('nancy', {
      start: 6,
      end: 11,
    }),
    repeat: -1,
    frameRate: animsFrameRate * 0.6,
  })

  anims.create({
    key: 'nancy_idle_left',
    frames: anims.generateFrameNames('nancy', {
      start: 12,
      end: 17,
    }),
    repeat: -1,
    frameRate: animsFrameRate * 0.6,
  })

  anims.create({
    key: 'nancy_idle_down',
    frames: anims.generateFrameNames('nancy', {
      start: 18,
      end: 23,
    }),
    repeat: -1,
    frameRate: animsFrameRate * 0.6,
  })

  anims.create({
    key: 'nancy_run_right',
    frames: anims.generateFrameNames('nancy', {
      start: 24,
      end: 29,
    }),
    repeat: -1,
    frameRate: animsFrameRate,
  })

  anims.create({
    key: 'nancy_run_up',
    frames: anims.generateFrameNames('nancy', {
      start: 30,
      end: 35,
    }),
    repeat: -1,
    frameRate: animsFrameRate,
  })

  anims.create({
    key: 'nancy_run_left',
    frames: anims.generateFrameNames('nancy', {
      start: 36,
      end: 41,
    }),
    repeat: -1,
    frameRate: animsFrameRate,
  })

  anims.create({
    key: 'nancy_run_down',
    frames: anims.generateFrameNames('nancy', {
      start: 42,
      end: 47,
    }),
    repeat: -1,
    frameRate: animsFrameRate,
  })

  anims.create({
    key: 'nancy_sit_down',
    frames: anims.generateFrameNames('nancy', {
      start: 48,
      end: 48,
    }),
    repeat: 0,
    frameRate: animsFrameRate,
  })

  anims.create({
    key: 'nancy_sit_left',
    frames: anims.generateFrameNames('nancy', {
      start: 49,
      end: 49,
    }),
    repeat: 0,
    frameRate: animsFrameRate,
  })

  anims.create({
    key: 'nancy_sit_right',
    frames: anims.generateFrameNames('nancy', {
      start: 50,
      end: 50,
    }),
    repeat: 0,
    frameRate: animsFrameRate,
  })

  anims.create({
    key: 'nancy_sit_up',
    frames: anims.generateFrameNames('nancy', {
      start: 51,
      end: 51,
    }),
    repeat: 0,
    frameRate: animsFrameRate,
  })

  anims.create({
    key: 'lucy_idle_right',
    frames: anims.generateFrameNames('lucy', {
      start: 0,
      end: 5,
    }),
    repeat: -1,
    frameRate: animsFrameRate * 0.6,
  })

  anims.create({
    key: 'lucy_idle_up',
    frames: anims.generateFrameNames('lucy', {
      start: 6,
      end: 11,
    }),
    repeat: -1,
    frameRate: animsFrameRate * 0.6,
  })

  anims.create({
    key: 'lucy_idle_left',
    frames: anims.generateFrameNames('lucy', {
      start: 12,
      end: 17,
    }),
    repeat: -1,
    frameRate: animsFrameRate * 0.6,
  })

  anims.create({
    key: 'lucy_idle_down',
    frames: anims.generateFrameNames('lucy', {
      start: 18,
      end: 23,
    }),
    repeat: -1,
    frameRate: animsFrameRate * 0.6,
  })

  anims.create({
    key: 'lucy_run_right',
    frames: anims.generateFrameNames('lucy', {
      start: 24,
      end: 29,
    }),
    repeat: -1,
    frameRate: animsFrameRate,
  })

  anims.create({
    key: 'lucy_run_up',
    frames: anims.generateFrameNames('lucy', {
      start: 30,
      end: 35,
    }),
    repeat: -1,
    frameRate: animsFrameRate,
  })

  anims.create({
    key: 'lucy_run_left',
    frames: anims.generateFrameNames('lucy', {
      start: 36,
      end: 41,
    }),
    repeat: -1,
    frameRate: animsFrameRate,
  })

  anims.create({
    key: 'lucy_run_down',
    frames: anims.generateFrameNames('lucy', {
      start: 42,
      end: 47,
    }),
    repeat: -1,
    frameRate: animsFrameRate,
  })

  anims.create({
    key: 'lucy_sit_down',
    frames: anims.generateFrameNames('lucy', {
      start: 48,
      end: 48,
    }),
    repeat: 0,
    frameRate: animsFrameRate,
  })

  anims.create({
    key: 'lucy_sit_left',
    frames: anims.generateFrameNames('lucy', {
      start: 49,
      end: 49,
    }),
    repeat: 0,
    frameRate: animsFrameRate,
  })

  anims.create({
    key: 'lucy_sit_right',
    frames: anims.generateFrameNames('lucy', {
      start: 50,
      end: 50,
    }),
    repeat: 0,
    frameRate: animsFrameRate,
  })

  anims.create({
    key: 'lucy_sit_up',
    frames: anims.generateFrameNames('lucy', {
      start: 51,
      end: 51,
    }),
    repeat: 0,
    frameRate: animsFrameRate,
  })

  anims.create({
    key: 'ash_idle_right',
    frames: anims.generateFrameNames('ash', {
      start: 0,
      end: 5,
    }),
    repeat: -1,
    frameRate: animsFrameRate * 0.6,
  })

  anims.create({
    key: 'ash_idle_up',
    frames: anims.generateFrameNames('ash', {
      start: 6,
      end: 11,
    }),
    repeat: -1,
    frameRate: animsFrameRate * 0.6,
  })

  anims.create({
    key: 'ash_idle_left',
    frames: anims.generateFrameNames('ash', {
      start: 12,
      end: 17,
    }),
    repeat: -1,
    frameRate: animsFrameRate * 0.6,
  })

  anims.create({
    key: 'ash_idle_down',
    frames: anims.generateFrameNames('ash', {
      start: 18,
      end: 23,
    }),
    repeat: -1,
    frameRate: animsFrameRate * 0.6,
  })

  anims.create({
    key: 'ash_run_right',
    frames: anims.generateFrameNames('ash', {
      start: 24,
      end: 29,
    }),
    repeat: -1,
    frameRate: animsFrameRate,
  })

  anims.create({
    key: 'ash_run_up',
    frames: anims.generateFrameNames('ash', {
      start: 30,
      end: 35,
    }),
    repeat: -1,
    frameRate: animsFrameRate,
  })

  anims.create({
    key: 'ash_run_left',
    frames: anims.generateFrameNames('ash', {
      start: 36,
      end: 41,
    }),
    repeat: -1,
    frameRate: animsFrameRate,
  })

  anims.create({
    key: 'ash_run_down',
    frames: anims.generateFrameNames('ash', {
      start: 42,
      end: 47,
    }),
    repeat: -1,
    frameRate: animsFrameRate,
  })

  anims.create({
    key: 'ash_sit_down',
    frames: anims.generateFrameNames('ash', {
      start: 48,
      end: 48,
    }),
    repeat: 0,
    frameRate: animsFrameRate,
  })

  anims.create({
    key: 'ash_sit_left',
    frames: anims.generateFrameNames('ash', {
      start: 49,
      end: 49,
    }),
    repeat: 0,
    frameRate: animsFrameRate,
  })

  anims.create({
    key: 'ash_sit_right',
    frames: anims.generateFrameNames('ash', {
      start: 50,
      end: 50,
    }),
    repeat: 0,
    frameRate: animsFrameRate,
  })

  anims.create({
    key: 'ash_sit_up',
    frames: anims.generateFrameNames('ash', {
      start: 51,
      end: 51,
    }),
    repeat: 0,
    frameRate: animsFrameRate,
  })

  anims.create({
    key: 'adam_idle_right',
    frames: anims.generateFrameNames('adam', {
      start: 0,
      end: 5,
    }),
    repeat: -1,
    frameRate: animsFrameRate * 0.6,
  })

  anims.create({
    key: 'adam_idle_up',
    frames: anims.generateFrameNames('adam', {
      start: 6,
      end: 11,
    }),
    repeat: -1,
    frameRate: animsFrameRate * 0.6,
  })

  anims.create({
    key: 'adam_idle_left',
    frames: anims.generateFrameNames('adam', {
      start: 12,
      end: 17,
    }),
    repeat: -1,
    frameRate: animsFrameRate * 0.6,
  })

  anims.create({
    key: 'adam_idle_down',
    frames: anims.generateFrameNames('adam', {
      start: 18,
      end: 23,
    }),
    repeat: -1,
    frameRate: animsFrameRate * 0.6,
  })

  anims.create({
    key: 'adam_run_right',
    frames: anims.generateFrameNames('adam', {
      start: 24,
      end: 29,
    }),
    repeat: -1,
    frameRate: animsFrameRate,
  })

  anims.create({
    key: 'adam_run_up',
    frames: anims.generateFrameNames('adam', {
      start: 30,
      end: 35,
    }),
    repeat: -1,
    frameRate: animsFrameRate,
  })

  anims.create({
    key: 'adam_run_left',
    frames: anims.generateFrameNames('adam', {
      start: 36,
      end: 41,
    }),
    repeat: -1,
    frameRate: animsFrameRate,
  })

  anims.create({
    key: 'adam_run_down',
    frames: anims.generateFrameNames('adam', {
      start: 42,
      end: 47,
    }),
    repeat: -1,
    frameRate: animsFrameRate,
  })

  anims.create({
    key: 'adam_sit_down',
    frames: anims.generateFrameNames('adam', {
      start: 48,
      end: 48,
    }),
    repeat: 0,
    frameRate: animsFrameRate,
  })

  anims.create({
    key: 'adam_sit_left',
    frames: anims.generateFrameNames('adam', {
      start: 49,
      end: 49,
    }),
    repeat: 0,
    frameRate: animsFrameRate,
  })

  anims.create({
    key: 'adam_sit_right',
    frames: anims.generateFrameNames('adam', {
      start: 50,
      end: 50,
    }),
    repeat: 0,
    frameRate: animsFrameRate,
  })

  anims.create({
    key: 'adam_sit_up',
    frames: anims.generateFrameNames('adam', {
      start: 51,
      end: 51,
    }),
    repeat: 0,
    frameRate: animsFrameRate,
  })
}
