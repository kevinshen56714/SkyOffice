import Phaser from 'phaser'

export default class Item extends Phaser.Physics.Arcade.Sprite {
  private _itemType!: string
  private dialogBox!: Phaser.GameObjects.Container
  constructor(scene: Phaser.Scene, x: number, y: number, texture: string, frame?: string | number) {
    super(scene, x, y, texture, frame)

    // add a container on top of everything which we can add text in later
    this.dialogBox = this.scene.add.container().setDepth(10000)
  }

  get itemType() {
    return this._itemType
  }

  setItemType(type: string) {
    this._itemType = type
  }

  // add dialog box into the item container
  setDialogBox(text: string, width: number) {
    const dialogBoxWidth = width
    const dialogBoxHeight = 20
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
