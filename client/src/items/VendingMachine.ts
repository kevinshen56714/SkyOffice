import { ItemType } from '../../../types/Items'
import store from '../stores'
import { setShowButtonR } from '../stores/JoystickStore'
import Item from './Item'

export default class VendingMachine extends Item {
  constructor(scene: Phaser.Scene, x: number, y: number, texture: string, frame?: string | number) {
    super(scene, x, y, texture, frame)

    this.itemType = ItemType.VENDINGMACHINE
  }

  onOverlapDialog() {
    store.dispatch(setShowButtonR(true))
    this.setDialogBox('Press R to buy a coffee :)')
  }
}
