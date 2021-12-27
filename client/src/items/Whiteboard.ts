import { ItemType } from '../../../types/Items'
import store from '../stores'
import Item from './Item'
import Network from '../services/Network'
import { openWhiteboardDialog } from '../stores/WhiteboardStore'

export default class Whiteboard extends Item {
  id?: string
  currentUsers = new Array<string>()

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string, frame?: string | number) {
    super(scene, x, y, texture, frame)

    this.itemType = ItemType.WHITEBOARD
    this.currentUsers = []
  }

  private updateStatus() {
    if (!this.currentUsers) return
    const numberOfUsers = this.currentUsers.length
    this.clearStatusBox()
    if (numberOfUsers === 1) {
      this.setStatusBox(`${numberOfUsers} user`)
    } else if (numberOfUsers > 1) {
      this.setStatusBox(`${numberOfUsers} users`)
    }
  }

  onOverlapDialog() {
    if (this.currentUsers.length === 0) {
      this.setDialogBox('Press R to use whiteboard')
    } else {
      this.setDialogBox('Press R join')
    }
  }

  addCurrentUser(userId: string) {
    if (!this.currentUsers) return
    this.currentUsers.push(userId)
    this.updateStatus()
  }

  removeCurrentUser(userId: string) {
    if (!this.currentUsers) return
    const index = this.currentUsers.indexOf(userId)
    if (index > -1) {
      this.currentUsers.splice(index, 1)
    }
    this.updateStatus()
  }

  openDialog(network: Network) {
    if (!this.id) return
    store.dispatch(openWhiteboardDialog(this.id))
    network.connectToWhiteboard(this.id)
  }
}
