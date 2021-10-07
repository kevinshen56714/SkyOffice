import Phaser from 'phaser'

export default class Item extends Phaser.Physics.Arcade.Sprite {
  private dialogBox!: Phaser.GameObjects.Container

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string, frame?: string | number) {
    super(scene, x, y, texture, frame)

    // add a container on top of everything which we can add text in later
    this.dialogBox = this.scene.add.container().setDepth(10000)
  }

  private _itemDirection!: string
  set itemDirection(direction: string) {
    this._itemDirection = direction
  }
  get itemDirection() {
    return this._itemDirection
  }

  private _id!: string
  set id(id: string) {
    this._id = id
  }
  get id() {
    return this._id
  }

  onOverlapDialog() {
    switch (this.texture.key) {
      case 'chairs':
        this.setDialogBox('Press E to sit', 80)
        break

      case 'computers':
        this.setDialogBox('Press R to use computer', 140)
        break
    }
  }

  // add dialog box into the item container
  setDialogBox(text: string, width: number) {
    const dialogBoxWidth = width
    const dialogBoxHeight = 20
    const dialogBoxX = this.x - dialogBoxWidth * 0.5
    const dialogBoxY =
      this.texture.key === 'chairs' ? this.y + this.height * 0.5 : this.y - this.height * 0.75
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

  // remove everything in the item container
  clearDialogBox() {
    this.dialogBox.removeAll(true)
  }
}
