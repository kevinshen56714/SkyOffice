import Phaser from 'phaser'
import store from '../stores'

export default class Item extends Phaser.Physics.Arcade.Sprite {
  private dialogBox!: Phaser.GameObjects.Container
  private statusBox!: Phaser.GameObjects.Container
  itemDirection?: string
  id?: string
  currentUsers = new Array<string>()

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string, frame?: string | number) {
    super(scene, x, y, texture, frame)

    // add dialogBox and statusBox containers on top of everything which we can add text in later
    this.dialogBox = this.scene.add.container().setDepth(10000)
    this.statusBox = this.scene.add.container().setDepth(10000)
  }

  onOverlapDialog() {
    switch (this.texture.key) {
      case 'chairs':
        this.setDialogBox('Press E to sit', 80)
        break

      case 'computers':
        if (this.currentUsers.length === 0) {
          this.setDialogBox('Press R to use computer', 140)
        } else {
          this.setDialogBox('Press R join', 70)
        }
        break
    }
  }

  // add texts into dialog box container
  setDialogBox(text: string, width: number) {
    const dialogBoxWidth = width
    const dialogBoxHeight = 20
    const dialogBoxX = this.x - dialogBoxWidth * 0.5
    const dialogBoxY = this.y + this.height * 0.5
    // this.texture.key === 'chairs' ? this.y + this.height * 0.5 : this.y - this.height * 0.75
    this.dialogBox.add(
      this.scene.add
        .graphics()
        .fillStyle(0xffffff, 1)
        .fillRoundedRect(dialogBoxX, dialogBoxY, dialogBoxWidth, dialogBoxHeight, 3)
        .lineStyle(2, 0x000000, 1)
        .strokeRoundedRect(dialogBoxX, dialogBoxY, dialogBoxWidth, dialogBoxHeight, 3)
    )
    this.dialogBox.add(
      this.scene.add
        .text(dialogBoxX + 2, dialogBoxY + 2, text)
        .setFontFamily('Arial')
        .setFontSize(12)
        .setColor('#000000')
    )
  }

  // remove everything in the dialog box container
  clearDialogBox() {
    this.dialogBox.removeAll(true)
  }

  // add text into status box container
  setStatusBox(text: string, width: number) {
    const statusBoxWidth = width
    const statusBoxHeight = 15
    const statusBoxX = this.x - statusBoxWidth * 0.5
    const statusBoxY = this.y - this.height * 0.25
    this.statusBox.add(
      this.scene.add
        .graphics()
        .fillStyle(0xffffff, 1)
        .fillRoundedRect(statusBoxX, statusBoxY, statusBoxWidth, statusBoxHeight, 3)
        .lineStyle(2, 0x000000, 1)
        .strokeRoundedRect(statusBoxX, statusBoxY, statusBoxWidth, statusBoxHeight, 3)
    )
    this.statusBox.add(
      this.scene.add
        .text(statusBoxX + 3, statusBoxY, text)
        .setFontFamily('Arial')
        .setFontSize(12)
        .setColor('#000000')
    )
  }

  // remove everything in the status box container
  clearStatusBox() {
    this.statusBox.removeAll(true)
  }

  addCurrentUser(userId: string) {
    this.currentUsers?.push(userId)
    const computerState = store.getState().computer
    if (computerState.computerId === this.id) {
      computerState.shareScreenManager?.onUserJoined(userId)
    }
  }

  removeCurrentUser(userId: string) {
    if (this.currentUsers) {
      const index = this.currentUsers.indexOf(userId)
      if (index > -1) {
        this.currentUsers.splice(index, 1)

        const computerState = store.getState().computer
        if (computerState.computerId === this.id) {
          computerState.shareScreenManager?.onUserLeft(userId)
        }
      }
    }
  }

  updateStatus() {
    const numberOfUsers = this.currentUsers.length
    this.clearStatusBox()
    if (numberOfUsers === 1) {
      this.setStatusBox(`${numberOfUsers} user`, 40)
    } else if (numberOfUsers > 1) {
      this.setStatusBox(`${numberOfUsers} users`, 45)
    }
  }
}
