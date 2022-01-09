import { ItemType } from '../../../types/Items'
import Item from './Item'

import network from '../services/Network'
import store from '../stores'
import { openComputerDialog } from '../stores/ComputerStore'

export default class Computer extends Item {
  id?: string
  currentUsers = new Set<string>()

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string, frame?: string | number) {
    super(scene, x, y, texture, frame)

    this.itemType = ItemType.COMPUTER
  }

  private updateStatus() {
    if (!this.currentUsers) return
    const numberOfUsers = this.currentUsers.size
    this.clearStatusBox()
    if (numberOfUsers === 1) {
      this.setStatusBox(`${numberOfUsers} user`)
    } else if (numberOfUsers > 1) {
      this.setStatusBox(`${numberOfUsers} users`)
    }
  }

  onOverlapDialog() {
    if (this.currentUsers.size === 0) {
      this.setDialogBox('Press R to use computer')
    } else {
      this.setDialogBox('Press R join')
    }
  }

  addCurrentUser(webRTCId: string) {
    if (!this.currentUsers || this.currentUsers.has(webRTCId)) return
    this.currentUsers.add(webRTCId)
    const computerState = store.getState().computer
    if (computerState.computerId === this.id) {
      computerState.shareScreenManager?.onUserJoined(webRTCId)
    }
    this.updateStatus()
  }

  removeCurrentUser(webRTCId: string) {
    if (!this.currentUsers || !this.currentUsers.has(webRTCId)) return
    this.currentUsers.delete(webRTCId)
    const computerState = store.getState().computer
    if (computerState.computerId === this.id) {
      computerState.shareScreenManager?.onUserLeft(webRTCId)
    }
    this.updateStatus()
  }

  openDialog(webRTCId: string) {
    if (!this.id) return
    store.dispatch(openComputerDialog({ computerId: this.id, myWebRTCId: webRTCId }))
    network.connectToComputer(this.id)
  }
}
