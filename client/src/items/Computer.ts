import { ItemType } from '../../../types/Items'
import store from '../stores'
import Item from './Item'
import Network from '../services/Network'
import { openComputerDialog } from '../stores/ComputerStore'

export default class Computer extends Item {
  id?: string
  currentUsers = new Array<string>()

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string, frame?: string | number) {
    super(scene, x, y, texture, frame)

    this.itemType = ItemType.COMPUTER
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
      this.setDialogBox('Press R to use computer')
    } else {
      this.setDialogBox('Press R join')
    }
  }

  addCurrentUser(userId: string) {
    if (!this.currentUsers) return
    this.currentUsers.push(userId)
    const computerState = store.getState().computer
    if (computerState.computerId === this.id) {
      computerState.shareScreenManager?.onUserJoined(userId)
    }
    this.updateStatus()
  }

  removeCurrentUser(userId: string) {
    if (!this.currentUsers) return
    const index = this.currentUsers.indexOf(userId)
    if (index > -1) {
      this.currentUsers.splice(index, 1)

      const computerState = store.getState().computer
      if (computerState.computerId === this.id) {
        computerState.shareScreenManager?.onUserLeft(userId)
      }
    }
    this.updateStatus()
  }

  openDialog(playerId: string, network: Network) {
    if (!this.id) return
    store.dispatch(openComputerDialog({ computerId: this.id, myUserId: playerId }))
    network.connectToComputer(this.id)
  }
}
