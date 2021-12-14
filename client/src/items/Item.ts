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
        this.setDialogBox('Press E to sit')
        break

      case 'computers':
        if (this.currentUsers.length === 0) {
          this.setDialogBox('Press R to use computer')
        } else {
          this.setDialogBox('Press R join')
        }
        break
    }
  }

  // add texts into dialog box container
  setDialogBox(text: string) {
    const innerText = this.scene.add
      .text(0, 0, text)
      .setFontFamily('Arial')
      .setFontSize(12)
      .setColor('#000000')

    // set dialogBox slightly larger than the text in it
    const innerTextBounds = innerText.getBounds()
    const dialogBoxWidth = innerTextBounds.width + 4
    const dialogBoxHeight = innerTextBounds.height + 2
    const dialogBoxX = this.x - dialogBoxWidth * 0.5
    const dialogBoxY = this.y + this.height * 0.5

    this.dialogBox.add(
      this.scene.add
        .graphics()
        .fillStyle(0xffffff, 1)
        .fillRoundedRect(dialogBoxX, dialogBoxY, dialogBoxWidth, dialogBoxHeight, 3)
        .lineStyle(2, 0x000000, 1)
        .strokeRoundedRect(dialogBoxX, dialogBoxY, dialogBoxWidth, dialogBoxHeight, 3)
    )
    this.dialogBox.add(innerText.setPosition(dialogBoxX + 2, dialogBoxY))
  }

  // remove everything in the dialog box container
  clearDialogBox() {
    this.dialogBox.removeAll(true)
  }

  // add text into status box container
  setStatusBox(text: string) {
    const innerText = this.scene.add
      .text(0, 0, text)
      .setFontFamily('Arial')
      .setFontSize(12)
      .setColor('#000000')

    // set dialogBox slightly larger than the text in it
    const innerTextBounds = innerText.getBounds()
    const statusBoxWidth = innerTextBounds.width + 4
    const statusBoxHeight = innerTextBounds.height + 2
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
    this.statusBox.add(innerText.setPosition(statusBoxX + 2, statusBoxY))
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
      this.setStatusBox(`${numberOfUsers} user`)
    } else if (numberOfUsers > 1) {
      this.setStatusBox(`${numberOfUsers} users`)
    }
  }
}
