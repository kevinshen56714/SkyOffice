import { ItemType } from '../../../types/Items'
import store from '../stores'
import { setShowButtonE } from '../stores/JoystickStore'
import Item from './Item'

export default class Chair extends Item {
  itemDirection?: string

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string, frame?: string | number) {
    super(scene, x, y, texture, frame)

    this.itemType = ItemType.CHAIR
  }

  onOverlapDialog() {
    store.dispatch(setShowButtonE(true))
    this.setDialogBox('Press E to sit')
  }
}
