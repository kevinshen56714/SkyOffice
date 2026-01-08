import Phaser from 'phaser'

// import { debugDraw } from '../utils/debug'
import { createCharacterAnims } from '../anims/CharacterAnims'

import Item from '../items/Item'
import Chair from '../items/Chair'
import Computer from '../items/Computer'
import Whiteboard from '../items/Whiteboard'
import VendingMachine from '../items/VendingMachine'
import '../characters/MyPlayer'
import '../characters/OtherPlayer'
import MyPlayer from '../characters/MyPlayer'
import OtherPlayer from '../characters/OtherPlayer'
import PlayerSelector from '../characters/PlayerSelector'
import Network from '../services/Network'
import { phaserEvents, Event } from '../events/EventCenter'
import { IPlayer } from '../../../types/IOfficeState'
import { PlayerBehavior } from '../../../types/PlayerBehavior'
import { ItemType } from '../../../types/Items'

import store from '../stores'
import { setFocused, setShowChat } from '../stores/ChatStore'
import { updateMeetingRoomArea } from '../stores/MeetingRoomStore'
import { NavKeys, Keyboard } from '../../../types/KeyboardState'
import { MeetingRoomManager } from './MeetingRoom'
import { createMeetingRoomWithArea } from '../utils/mRoom'
export default class Game extends Phaser.Scene {
  network!: Network
  private cursors!: NavKeys
  private keyE!: Phaser.Input.Keyboard.Key
  private keyR!: Phaser.Input.Keyboard.Key
  private map!: Phaser.Tilemaps.Tilemap
  myPlayer!: MyPlayer
  private playerSelector!: Phaser.GameObjects.Zone
  private otherPlayers!: Phaser.Physics.Arcade.Group
  private otherPlayerMap = new Map<string, OtherPlayer>()
  computerMap = new Map<string, Computer>()
  private whiteboardMap = new Map<string, Whiteboard>()
  private meetingRoomManager!: MeetingRoomManager
  
  // Meeting Room Edit Mode
  private meetingRoomEditMode = false
  private editableRoomAreas: Map<string, Phaser.GameObjects.GameObject> = new Map()
  private draggedRoom: { roomId: string, startX: number, startY: number, graphics: Phaser.GameObjects.Graphics } | null = null
  private resizeHandle: { roomId: string, handle: 'nw' | 'ne' | 'sw' | 'se', graphics: Phaser.GameObjects.Graphics } | null = null
  
  // Global drag state for manual implementation
  private globalDragState: {
    isDragging: boolean
    roomId: string | null
    startX: number
    startY: number
    rectStartX: number
    rectStartY: number
  } = {
    isDragging: false,
    roomId: null,
    startX: 0,
    startY: 0,
    rectStartX: 0,
    rectStartY: 0
  }
  
  constructor() {
    super('game')
  }

  registerKeys() {
    this.cursors = {
      ...this.input.keyboard.createCursorKeys(),
      ...(this.input.keyboard.addKeys('W,S,A,D') as Keyboard),
    }

    // maybe we can have a dedicated method for adding keys if more keys are needed in the future
    this.keyE = this.input.keyboard.addKey('E')
    this.keyR = this.input.keyboard.addKey('R')
    this.input.keyboard.disableGlobalCapture()
    this.input.keyboard.on('keydown-ENTER', (event) => {
      store.dispatch(setShowChat(true))
      store.dispatch(setFocused(true))
    })
    this.input.keyboard.on('keydown-ESC', (event) => {
      store.dispatch(setShowChat(false))
    })
  }

  disableKeys() {
    this.input.keyboard.enabled = false
  }

  enableKeys() {
    this.input.keyboard.enabled = true
  }

  create(data: { network: Network }) {
    if (!data.network) {
      throw new Error('server instance missing')
    } else {
      this.network = data.network
      console.log('🚀 [Game] Initialized with network connection')
    }

    createCharacterAnims(this.anims)
    
    // Make game instance globally available for DevMode
    if (typeof window !== 'undefined') {
      (window as any).game = this
      console.log('🌐 [Game] Global game instance available for debugging')
    }
    
    // Set up Redux store subscription for avatar updates
    let previousAvatarSprite = ''
    store.subscribe(() => {
      const currentAvatarSprite = store.getState().work.currentAvatarSprite
      if (currentAvatarSprite !== previousAvatarSprite && this.myPlayer) {
        console.log(`🔄 [Game] Avatar sprite changed: ${previousAvatarSprite} → ${currentAvatarSprite}`)
        this.myPlayer.updateAvatarFromWorkState()
        previousAvatarSprite = currentAvatarSprite
      }
    })

    this.map = this.make.tilemap({ key: 'tilemap' })
    const FloorAndGround = this.map.addTilesetImage('FloorAndGround', 'tiles_wall')

    const groundLayer = this.map.createLayer('Ground', FloorAndGround)
    groundLayer.setCollisionByProperty({ collides: true })

    // debugDraw(groundLayer, this)

    this.myPlayer = this.add.myPlayer(705, 500, 'adam', this.network.mySessionId)
    this.playerSelector = new PlayerSelector(this, 0, 0, 16, 16)

    // import chair objects from Tiled map to Phaser
    const chairs = this.physics.add.staticGroup({ classType: Chair })
    const chairLayer = this.map.getObjectLayer('Chair')
    chairLayer.objects.forEach((chairObj) => {
      const item = this.addObjectFromTiled(chairs, chairObj, 'chairs', 'chair') as Chair
      // custom properties[0] is the object direction specified in Tiled
      item.itemDirection = chairObj.properties[0].value
    })

    // import computers objects from Tiled map to Phaser
    const computers = this.physics.add.staticGroup({ classType: Computer })
    const computerLayer = this.map.getObjectLayer('Computer')
    computerLayer.objects.forEach((obj, i) => {
      const item = this.addObjectFromTiled(computers, obj, 'computers', 'computer') as Computer
      item.setDepth(item.y + item.height * 0.27)
      const id = `${i}`
      item.id = id
      this.computerMap.set(id, item)
    })

    // import whiteboards objects from Tiled map to Phaser
    const whiteboards = this.physics.add.staticGroup({ classType: Whiteboard })
    const whiteboardLayer = this.map.getObjectLayer('Whiteboard')
    whiteboardLayer.objects.forEach((obj, i) => {
      const item = this.addObjectFromTiled(
        whiteboards,
        obj,
        'whiteboards',
        'whiteboard'
      ) as Whiteboard
      const id = `${i}`
      item.id = id
      this.whiteboardMap.set(id, item)
    })

    // import vending machine objects from Tiled map to Phaser
    const vendingMachines = this.physics.add.staticGroup({ classType: VendingMachine })
    const vendingMachineLayer = this.map.getObjectLayer('VendingMachine')
    vendingMachineLayer.objects.forEach((obj, i) => {
      this.addObjectFromTiled(vendingMachines, obj, 'vendingmachines', 'vendingmachine')
    })

    // import other objects from Tiled map to Phaser
    this.addGroupFromTiled('Wall', 'tiles_wall', 'FloorAndGround', false)
    this.addGroupFromTiled('Objects', 'office', 'Modern_Office_Black_Shadow', false)
    this.addGroupFromTiled('ObjectsOnCollide', 'office', 'Modern_Office_Black_Shadow', true)
    this.addGroupFromTiled('GenericObjects', 'generic', 'Generic', false)
    this.addGroupFromTiled('GenericObjectsOnCollide', 'generic', 'Generic', true)
    this.addGroupFromTiled('Basement', 'basement', 'Basement', true)

    this.otherPlayers = this.physics.add.group({ classType: OtherPlayer })

    this.cameras.main.zoom = 1.5
    this.cameras.main.startFollow(this.myPlayer, true)

    this.physics.add.collider([this.myPlayer, this.myPlayer.playerContainer], groundLayer)
    this.physics.add.collider([this.myPlayer, this.myPlayer.playerContainer], vendingMachines)

    this.physics.add.overlap(
      this.playerSelector,
      [chairs, computers, whiteboards, vendingMachines],
      this.handleItemSelectorOverlap,
      undefined,
      this
    )

    this.physics.add.overlap(
      this.myPlayer,
      this.otherPlayers,
      this.handlePlayersOverlap,
      undefined,
      this
    )
    // **********************

    const { room, area } = createMeetingRoomWithArea(
      'Meeting Room',
      'open',
      'hostUserId',
      192,
      482,
      448,
      296
    )
    this.meetingRoomManager = new MeetingRoomManager(this, this.myPlayer)
    this.events.on('enter-meeting-room', this.handleEnterMeetingRoom, this)
    this.events.on('leave-meeting-room', this.handleLeaveMeetingRoom, this)

    //**********************
    // register network event listeners
    console.log('📡 [Game] Registering network event listeners...')
    this.network.onPlayerJoined(this.handlePlayerJoined, this)
    this.network.onPlayerLeft(this.handlePlayerLeft, this)
    this.network.onMyPlayerReady(this.handleMyPlayerReady, this)
    this.network.onMyPlayerVideoConnected(this.handleMyVideoConnected, this)
    this.network.onPlayerUpdated(this.handlePlayerUpdated, this)
    this.network.onItemUserAdded(this.handleItemUserAdded, this)
    this.network.onItemUserRemoved(this.handleItemUserRemoved, this)
    this.network.onChatMessageAdded(this.handleChatMessageAdded, this)
    console.log('✅ [Game] Network event listeners registered successfully')
    
    // CRITICAL: Ensure input is properly enabled
    console.log('🔧 [Game] Enabling input systems explicitly...')
    this.input.enabled = true
    this.input.mouse.enabled = true
    
    // FORCE enable pointer events specifically
    this.input.mouse.disableContextMenu()
    this.input.manager.enabled = true
    
    console.log('🔧 [Game] Input manager state after force enable:', {
      inputEnabled: this.input.enabled,
      mouseEnabled: this.input.mouse.enabled,
      managerEnabled: this.input.manager.enabled,
      keyboard: this.input.keyboard.enabled
    })
    
    // Register keys (this might have been missing!)
    this.registerKeys()
    
    // Initialize meeting room edit mode
    this.initializeMeetingRoomEditMode()
  }

  private handleItemSelectorOverlap(playerSelector, selectionItem) {
    const currentItem = playerSelector.selectedItem as Item
    // currentItem is undefined if nothing was perviously selected
    if (currentItem) {
      // if the selection has not changed, do nothing
      if (currentItem === selectionItem || currentItem.depth >= selectionItem.depth) {
        return
      }
      // if selection changes, clear pervious dialog
      if (this.myPlayer.playerBehavior !== PlayerBehavior.SITTING) currentItem.clearDialogBox()
    }

    // set selected item and set up new dialog
    playerSelector.selectedItem = selectionItem
    selectionItem.onOverlapDialog()
  }

  private addObjectFromTiled(
    group: Phaser.Physics.Arcade.StaticGroup,
    object: Phaser.Types.Tilemaps.TiledObject,
    key: string,
    tilesetName: string
  ) {
    const actualX = object.x! + object.width! * 0.5
    const actualY = object.y! - object.height! * 0.5
    const obj = group
      .get(actualX, actualY, key, object.gid! - this.map.getTileset(tilesetName).firstgid)
      .setDepth(actualY)
    return obj
  }

  private addGroupFromTiled(
    objectLayerName: string,
    key: string,
    tilesetName: string,
    collidable: boolean
  ) {
    const group = this.physics.add.staticGroup()
    const objectLayer = this.map.getObjectLayer(objectLayerName)
    objectLayer.objects.forEach((object) => {
      const actualX = object.x! + object.width! * 0.5
      const actualY = object.y! - object.height! * 0.5
      group
        .get(actualX, actualY, key, object.gid! - this.map.getTileset(tilesetName).firstgid)
        .setDepth(actualY)
    })
    if (this.myPlayer && collidable)
      this.physics.add.collider([this.myPlayer, this.myPlayer.playerContainer], group)
  }

  // function to add new player to the otherPlayer group
  private handlePlayerJoined(newPlayer: IPlayer, id: string) {
    console.log(`🎮 [Game] Creating other player: ${id}, name: ${newPlayer.name}, position: (${newPlayer.x}, ${newPlayer.y})`)
    const otherPlayer = this.add.otherPlayer(newPlayer.x, newPlayer.y, 'adam', id, newPlayer.name)
    this.otherPlayers.add(otherPlayer)
    this.otherPlayerMap.set(id, otherPlayer)
    console.log(`✅ [Game] Other player added successfully: ${id}, total other players: ${this.otherPlayerMap.size}`)
  }

  // function to remove the player who left from the otherPlayer group
  private handlePlayerLeft(id: string) {
    if (this.otherPlayerMap.has(id)) {
      const otherPlayer = this.otherPlayerMap.get(id)
      if (!otherPlayer) return
      console.log(`👋 [Game] Removing player: ${id}, remaining players: ${this.otherPlayerMap.size - 1}`)
      this.otherPlayers.remove(otherPlayer, true, true)
      this.otherPlayerMap.delete(id)
    }
  }

  private handleMyPlayerReady() {
    this.myPlayer.readyToConnect = true
  }

  private handleMyVideoConnected() {
    this.myPlayer.videoConnected = true
  }

  private handlePlayerUpdated(field: string, value: number | string, id: string) {
    const otherPlayer = this.otherPlayerMap.get(id)
    otherPlayer?.updateOtherPlayer(field, value)
  }

  private handlePlayersOverlap(myPlayer, otherPlayer) {
    otherPlayer.makeCall(myPlayer, this.network?.webRTC)
  }

  private handleItemUserAdded(playerId: string, itemId: string, itemType: ItemType) {
    if (itemType === ItemType.COMPUTER) {
      const computer = this.computerMap.get(itemId)
      computer?.addCurrentUser(playerId)
    } else if (itemType === ItemType.WHITEBOARD) {
      const whiteboard = this.whiteboardMap.get(itemId)
      whiteboard?.addCurrentUser(playerId)
    }
  }

  private handleItemUserRemoved(playerId: string, itemId: string, itemType: ItemType) {
    if (itemType === ItemType.COMPUTER) {
      const computer = this.computerMap.get(itemId)
      computer?.removeCurrentUser(playerId)
    } else if (itemType === ItemType.WHITEBOARD) {
      const whiteboard = this.whiteboardMap.get(itemId)
      whiteboard?.removeCurrentUser(playerId)
    }
  }
  private handleChatMessageAdded(playerId: string, content: string) {
    const otherPlayer = this.otherPlayerMap.get(playerId)
    otherPlayer?.updateDialogBubble(content)
  }

  // プレイヤーステータスモーダルを開くイベントを発火
  openPlayerStatusModal(playerId?: string) {
    console.log('👤 [Game] Opening player status modal for:', playerId || 'self')
    // Reactコンポーネントに通知するためのイベント発火
    window.dispatchEvent(new CustomEvent('openPlayerStatusModal', { 
      detail: { playerId } 
    }))
  }

  handleEnterMeetingRoom(roomId: string, room: any): void {
    console.log('handleEnterMeetingRoom', roomId, room)
  }
  handleLeaveMeetingRoom(roomId: string): void {
    console.log('handleLeaveMeetingRoom', roomId)
  }
  update(t: number, dt: number) {
    if (this.myPlayer && this.network) {
      this.myPlayer.prevX = this.myPlayer.x
      this.myPlayer.prevY = this.myPlayer.y
      this.playerSelector.update(this.myPlayer, this.cursors)
      this.meetingRoomManager.checkPlayerInMeetingRoom(this.myPlayer.x, this.myPlayer.y)

      this.myPlayer.update(this.playerSelector, this.cursors, this.keyE, this.keyR, this.network)
    }
    
    // Manual drag handling in update loop
    if (this.meetingRoomEditMode && this.globalDragState.isDragging) {
      const pointer = this.input.activePointer
      if (pointer && pointer.isDown) {
        // Debug global drag state
        console.log('🎯 [Game] Global drag state check:', {
          startX: this.globalDragState.startX,
          startY: this.globalDragState.startY,
          pointerX: pointer.x,
          pointerY: pointer.y,
          rectStartX: this.globalDragState.rectStartX,
          rectStartY: this.globalDragState.rectStartY
        })
        
        const deltaX = pointer.x - this.globalDragState.startX
        const deltaY = pointer.y - this.globalDragState.startY
        
        console.log('🎯 [Game] *** UPDATE DRAGGING *** room:', this.globalDragState.roomId, 'pointer:', pointer.x, pointer.y, 'delta:', deltaX, deltaY)
        
        // Only update if delta is significant to avoid spam
        if (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1) {
          const newX = this.globalDragState.rectStartX + deltaX
          const newY = this.globalDragState.rectStartY + deltaY
          
          // Update room rectangle position
          const rect = this.editableRoomAreas.get(this.globalDragState.roomId!) as Phaser.GameObjects.Rectangle
          const label = this.editableRoomAreas.get(`${this.globalDragState.roomId}_label`) as Phaser.GameObjects.Text
          
          if (rect) {
            rect.setPosition(newX, newY)
            console.log('🎯 [Game] Rectangle moved to:', newX, newY)
          }
          if (label) {
            label.setPosition(newX, newY)
          }
        }
      } else if (!pointer?.isDown && this.globalDragState.isDragging) {
        // Mouse was released
        console.log('🎯 [Game] Mouse released - ending drag via update')
        this.endGlobalDrag()
      }
    }
  }

  // Helper method to end global drag
  private endGlobalDrag() {
    if (!this.globalDragState.isDragging) return
    
    console.log('🎯 [Game] Ending global drag for room:', this.globalDragState.roomId)
    
    const rect = this.editableRoomAreas.get(this.globalDragState.roomId!) as Phaser.GameObjects.Rectangle
    if (rect) {
      // Reset color
      rect.setFillStyle(0xff9800, 0.3)
      rect.setStrokeStyle(3, 0xff9800)
      
      // Update Redux
      const meetingRoomState = store.getState().meetingRoom
      const area = Object.values(meetingRoomState.meetingRoomAreas).find(a => a.meetingRoomId === this.globalDragState.roomId)
      if (area) {
        const newX = rect.x - area.width/2
        const newY = rect.y - area.height/2
        
        console.log('🎯 [Game] Final position update to:', newX, newY)
        
        const updateFunction = (window as any).devModeUpdateRoomArea
        if (updateFunction) {
          updateFunction(this.globalDragState.roomId, {
            x: newX,
            y: newY,
            width: area.width,
            height: area.height
          })
        }
      }
    }
    
    this.globalDragState.isDragging = false
    this.globalDragState.roomId = null
  }

  // Meeting Room Edit Mode Methods
  private initializeMeetingRoomEditMode() {
    // Using built-in Phaser drag functionality for clean, simple implementation
    console.log('🎯 [Game] Initialized meeting room edit mode with built-in drag support')
  }

  toggleMeetingRoomEditMode(enabled: boolean) {
    console.log('🎯 [Game] toggleMeetingRoomEditMode called with:', enabled)
    this.meetingRoomEditMode = enabled
    
    if (enabled) {
      console.log('🎯 [Game] Creating editable room areas...')
      // Hide existing meeting room manager graphics to avoid conflicts
      this.meetingRoomManager.hideRoomAreas()
      this.createEditableRoomAreas()
      console.log('🎨 [Game] Meeting room edit mode ENABLED')
    } else {
      console.log('🎯 [Game] Clearing editable room areas...')
      this.clearEditableRoomAreas()
      // Show meeting room manager graphics again
      this.meetingRoomManager.showRoomAreas()
      console.log('🎨 [Game] Meeting room edit mode DISABLED')
    }
  }
  

  // Setup DOM-based drag system for meeting room areas
  private setupRoomDragSystem(roomRect: Phaser.GameObjects.Rectangle, roomId: string) {
    console.log('🎯 [Game] Setting up DOM drag for room:', roomId)
    
    // Room-specific drag state
    const roomDragState = {
      isDragging: false,
      startMouseX: 0,
      startMouseY: 0,
      startObjX: 0,
      startObjY: 0,
      roomId: roomId
    }
    
    const canvas = this.game.canvas
    if (!canvas) {
      console.error('🎯 [Game] Canvas not found for room drag setup')
      return
    }
    
    // Pointer down event to start drag
    roomRect.on('pointerdown', (pointer: any) => {
      console.log('🎯 [Game] === ROOM POINTER DOWN ===', roomId)
      console.log('   Room position before:', roomRect.x, roomRect.y)
      
      roomDragState.isDragging = true
      roomDragState.startObjX = roomRect.x
      roomDragState.startObjY = roomRect.y
      
      // Store absolute mouse position
      const rect = canvas.getBoundingClientRect()
      roomDragState.startMouseX = pointer.x + rect.left
      roomDragState.startMouseY = pointer.y + rect.top
      
      // Visual feedback
      roomRect.setFillStyle(0x00ff00, 0.5)  // Green while dragging
      roomRect.setStrokeStyle(3, 0x00ff00)
      
      console.log('🎯 [Game] Room drag started for:', roomId)
    })
    
    // Document-level mousemove for room dragging
    const roomMouseMoveHandler = (event: MouseEvent) => {
      if (roomDragState.isDragging && roomRect.active) {
        const deltaX = event.clientX - roomDragState.startMouseX
        const deltaY = event.clientY - roomDragState.startMouseY
        const newX = roomDragState.startObjX + deltaX
        const newY = roomDragState.startObjY + deltaY
        
        console.log('🎯 [Game] ROOM DRAG -', roomId, 'delta:', deltaX, deltaY, 'newPos:', newX, newY)
        
        roomRect.setPosition(newX, newY)
        
        // Update label if exists
        const label = this.editableRoomAreas.get(`${roomId}_label`)
        if (label && 'setPosition' in label) {
          (label as any).setPosition(newX, newY)
        }
      }
    }
    
    // Document-level mouseup for room drag release
    const roomMouseUpHandler = (event: MouseEvent) => {
      if (roomDragState.isDragging) {
        console.log('🎯 [Game] === ROOM MOUSE UP ===', roomId)
        console.log('   Final position:', roomRect.x, roomRect.y)
        
        roomDragState.isDragging = false
        
        // Reset visual style
        roomRect.setFillStyle(0xff9800, 0.3)  // Back to orange
        roomRect.setStrokeStyle(3, 0xff9800)
        
        // Update Redux store with new position
        this.updateRoomPositionInStore(roomId, roomRect.x, roomRect.y)
        
        console.log('🎯 [Game] Room drag ended for:', roomId)
      }
    }
    
    // Add document event listeners
    document.addEventListener('mousemove', roomMouseMoveHandler)
    document.addEventListener('mouseup', roomMouseUpHandler)
    
    // Store handlers for cleanup
    roomRect.setData('mouseMoveHandler', roomMouseMoveHandler)
    roomRect.setData('mouseUpHandler', roomMouseUpHandler)
    
    console.log('🎯 [Game] DOM drag system setup complete for room:', roomId)
  }
  
  // Update room position in Redux store
  private updateRoomPositionInStore(roomId: string, centerX: number, centerY: number) {
    const meetingRoomState = store.getState().meetingRoom
    const area = Object.values(meetingRoomState.meetingRoomAreas).find(a => a.meetingRoomId === roomId)
    
    if (area) {
      // Convert from center position to top-left position
      const newX = centerX - area.width / 2
      const newY = centerY - area.height / 2
      
      console.log('🎯 [Game] Updating room position in store:', roomId, 'to:', newX, newY)
      
      // Use the saveRoomAreaChanges method for consistency
      this.saveRoomAreaChanges(roomId, newX, newY, area.width, area.height)
    } else {
      console.error('🎯 [Game] Room area not found in store:', roomId)
    }
  }

  private createEditableRoomAreas() {
    const meetingRoomState = store.getState().meetingRoom
    console.log('🎯 [Game] Meeting room state:', meetingRoomState)
    console.log('🎯 [Game] Meeting room areas:', meetingRoomState.meetingRoomAreas)
    
    if (Object.keys(meetingRoomState.meetingRoomAreas).length === 0) {
      console.warn('🎯 [Game] No meeting room areas found in state!')
    }
    
    Object.values(meetingRoomState.meetingRoomAreas).forEach(area => {
      console.log('🎯 [Game] Processing area:', area)
      if (area.meetingRoomId) {
        this.createEditableRoomGraphics(area.meetingRoomId, area.x, area.y, area.width, area.height)
      } else {
        console.warn('🎯 [Game] Area has no meetingRoomId:', area)
      }
    })
  }

  private createEditableRoomGraphics(roomId: string, x: number, y: number, width: number, height: number) {
    console.log('🎯 [Game] Creating editable room graphics for:', roomId, 'at position:', x, y, 'size:', width, height)
    
    // Create a simple rectangle sprite instead of graphics
    const rect = this.add.rectangle(x + width/2, y + height/2, width, height, 0xff9800, 0.3)
    rect.setStrokeStyle(3, 0xff9800)
    rect.setInteractive()  // Make interactive but use DOM drag
    rect.setData('roomId', roomId)
    
    // Apply DOM-based drag system to meeting room area
    this.setupRoomDragSystem(rect, roomId)
    rect.setData('type', 'room')
    rect.setDepth(2000)  // Higher depth to ensure it's above MeetingRoomManager graphics
    
    console.log('🎯 [Game] Rectangle created for room:', roomId)
    
    // Visual feedback on hover
    rect.on('pointerover', () => {
      if (!rect.getData('isDragging')) {
        rect.setFillStyle(0xff9800, 0.5)  // Slightly more opaque on hover
      }
    })
    
    rect.on('pointerout', () => {
      if (!rect.getData('isDragging')) {
        rect.setFillStyle(0xff9800, 0.3)  // Back to normal opacity
      }
    })
    
    // Add room label
    const text = this.add.text(x + width/2, y + height/2, '🏢 ROOM\n(Drag me!)', {
      fontSize: '12px',
      color: '#bf360c',
      align: 'center',
      backgroundColor: '#ffffff',
      padding: { x: 4, y: 2 }
    })
    text.setOrigin(0.5, 0.5)
    text.setDepth(2001)  // Higher depth to ensure it's above MeetingRoomManager graphics
    
    this.editableRoomAreas.set(roomId, rect)
    this.editableRoomAreas.set(`${roomId}_label`, text)
    
    // Resize handles
    this.createResizeHandles(roomId, x, y, width, height)
  }

  // Old drawRoomArea method - no longer needed with Rectangle approach
  /*
  private drawRoomArea(graphics: Phaser.GameObjects.Graphics, x: number, y: number, width: number, height: number, isDragging: boolean = false) {
    // Replaced by Rectangle objects with built-in fill/stroke methods
  }
  */

  private createResizeHandles(roomId: string, x: number, y: number, width: number, height: number) {
    const handleSize = 10
    const handles = [
      { key: 'nw', x: x - handleSize/2, y: y - handleSize/2 },
      { key: 'ne', x: x + width - handleSize/2, y: y - handleSize/2 },
      { key: 'sw', x: x - handleSize/2, y: y + height - handleSize/2 },
      { key: 'se', x: x + width - handleSize/2, y: y + height - handleSize/2 }
    ]
    
    handles.forEach(handle => {
      const handleGraphics = this.add.graphics()
      handleGraphics.setPosition(handle.x, handle.y)
      handleGraphics.setInteractive(new Phaser.Geom.Rectangle(0, 0, handleSize, handleSize), Phaser.Geom.Rectangle.Contains)
      handleGraphics.input.draggable = true
      handleGraphics.setData('roomId', roomId)
      handleGraphics.setData('type', 'handle')
      handleGraphics.setData('handle', handle.key)
      
      handleGraphics.fillStyle(0xff5722, 1)
      handleGraphics.fillRect(0, 0, handleSize, handleSize)
      handleGraphics.setDepth(1001)
      
      // Add resize drag functionality
      let isResizing = false
      let resizeStartX = 0
      let resizeStartY = 0
      let originalRoomData = { x: 0, y: 0, width: 0, height: 0 }
      
      handleGraphics.on('dragstart', (pointer: any) => {
        console.log('🎯 [Game] Resize handle drag start:', handle.key, 'for room:', roomId)
        isResizing = true
        resizeStartX = pointer.x
        resizeStartY = pointer.y
        
        // Store original room data
        const rect = this.editableRoomAreas.get(roomId) as Phaser.GameObjects.Rectangle
        if (rect) {
          const area = Object.values(store.getState().meetingRoom.meetingRoomAreas).find(a => a.meetingRoomId === roomId)
          if (area) {
            originalRoomData = { x: area.x, y: area.y, width: area.width, height: area.height }
          }
        }
        
        // Change handle color during resize
        handleGraphics.clear()
        handleGraphics.fillStyle(0x4caf50, 1)  // Green when resizing
        handleGraphics.fillRect(0, 0, handleSize, handleSize)
      })
      
      handleGraphics.on('drag', (pointer: any, dragX: number, dragY: number) => {
        console.log('🎯 [Game] Resizing room:', roomId, 'handle:', handle.key, 'to:', dragX, dragY)
        
        const rect = this.editableRoomAreas.get(roomId) as Phaser.GameObjects.Rectangle
        const label = this.editableRoomAreas.get(`${roomId}_label`) as Phaser.GameObjects.Text
        if (!rect) return
        
        const deltaX = pointer.x - resizeStartX
        const deltaY = pointer.y - resizeStartY
        
        let newX = originalRoomData.x
        let newY = originalRoomData.y
        let newWidth = originalRoomData.width
        let newHeight = originalRoomData.height
        
        // Calculate new dimensions based on handle type
        switch (handle.key) {
          case 'nw': // Northwest: adjust x, y, width, height
            newX = originalRoomData.x + deltaX
            newY = originalRoomData.y + deltaY
            newWidth = originalRoomData.width - deltaX
            newHeight = originalRoomData.height - deltaY
            break
          case 'ne': // Northeast: adjust y, width, height
            newY = originalRoomData.y + deltaY
            newWidth = originalRoomData.width + deltaX
            newHeight = originalRoomData.height - deltaY
            break
          case 'sw': // Southwest: adjust x, width, height
            newX = originalRoomData.x + deltaX
            newWidth = originalRoomData.width - deltaX
            newHeight = originalRoomData.height + deltaY
            break
          case 'se': // Southeast: adjust width, height
            newWidth = originalRoomData.width + deltaX
            newHeight = originalRoomData.height + deltaY
            break
        }
        
        // Enforce minimum size constraints
        const minSize = 50
        if (newWidth < minSize) {
          if (handle.key.includes('w')) newX = originalRoomData.x + originalRoomData.width - minSize
          newWidth = minSize
        }
        if (newHeight < minSize) {
          if (handle.key.includes('n')) newY = originalRoomData.y + originalRoomData.height - minSize
          newHeight = minSize
        }
        
        // Update rectangle visual
        rect.setPosition(newX + newWidth/2, newY + newHeight/2)
        rect.setSize(newWidth, newHeight)
        rect.setFillStyle(0x4caf50, 0.4)  // Green tint during resize
        rect.setStrokeStyle(3, 0x4caf50)
        
        // Update label position
        if (label) {
          label.setPosition(newX + newWidth/2, newY + newHeight/2)
        }
        
        // Update all handles positions
        this.updateHandlePositions(roomId, newX, newY, newWidth, newHeight)
      })
      
      handleGraphics.on('dragend', (pointer: any) => {
        console.log('🎯 [Game] Resize handle drag end for room:', roomId)
        isResizing = false
        
        // Reset handle color
        handleGraphics.clear()
        handleGraphics.fillStyle(0xff5722, 1)
        handleGraphics.fillRect(0, 0, handleSize, handleSize)
        
        const rect = this.editableRoomAreas.get(roomId) as Phaser.GameObjects.Rectangle
        if (rect) {
          // Reset rectangle color
          rect.setFillStyle(0xff9800, 0.3)
          rect.setStrokeStyle(3, 0xff9800)
          
          // Calculate final dimensions
          const deltaX = pointer.x - resizeStartX
          const deltaY = pointer.y - resizeStartY
          
          let finalX = originalRoomData.x
          let finalY = originalRoomData.y
          let finalWidth = originalRoomData.width
          let finalHeight = originalRoomData.height
          
          switch (handle.key) {
            case 'nw':
              finalX = originalRoomData.x + deltaX
              finalY = originalRoomData.y + deltaY
              finalWidth = originalRoomData.width - deltaX
              finalHeight = originalRoomData.height - deltaY
              break
            case 'ne':
              finalY = originalRoomData.y + deltaY
              finalWidth = originalRoomData.width + deltaX
              finalHeight = originalRoomData.height - deltaY
              break
            case 'sw':
              finalX = originalRoomData.x + deltaX
              finalWidth = originalRoomData.width - deltaX
              finalHeight = originalRoomData.height + deltaY
              break
            case 'se':
              finalWidth = originalRoomData.width + deltaX
              finalHeight = originalRoomData.height + deltaY
              break
          }
          
          // Enforce minimum constraints
          const minSize = 50
          if (finalWidth < minSize) {
            if (handle.key.includes('w')) finalX = originalRoomData.x + originalRoomData.width - minSize
            finalWidth = minSize
          }
          if (finalHeight < minSize) {
            if (handle.key.includes('n')) finalY = originalRoomData.y + originalRoomData.height - minSize
            finalHeight = minSize
          }
          
          // Update Redux store
          const updateFunction = (window as any).devModeUpdateRoomArea
          if (updateFunction) {
            updateFunction(roomId, {
              x: finalX,
              y: finalY,
              width: finalWidth,
              height: finalHeight
            })
            console.log('🎯 [Game] Updated room area via resize to:', finalX, finalY, finalWidth, finalHeight)
            
            // Save changes to Redux and server
            this.saveRoomAreaChanges(roomId, finalX, finalY, finalWidth, finalHeight)
          }
        }
      })
      
      this.editableRoomAreas.set(`${roomId}_handle_${handle.key}`, handleGraphics)
    })
  }
  
  private saveRoomAreaChanges(roomId: string, x: number, y: number, width: number, height: number) {
    console.log('💾 [Game] Saving room area changes:', { roomId, x, y, width, height })
    
    // Update Redux store
    const updatedArea = {
      meetingRoomId: roomId,
      x: Math.round(x),
      y: Math.round(y), 
      width: Math.round(width),
      height: Math.round(height)
    }
    
    store.dispatch(updateMeetingRoomArea(updatedArea))
    
    // Send to server
    if (this.network) {
      console.log('📡 [Game] Sending area changes to server:', updatedArea)
      this.network.updateMeetingRoomArea(roomId, {
        x: updatedArea.x,
        y: updatedArea.y,
        width: updatedArea.width,
        height: updatedArea.height
      })
    } else {
      console.warn('⚠️ [Game] Network not available for saving area changes')
    }
  }

  private updateHandlePositions(roomId: string, x: number, y: number, width: number, height: number) {
    const handleSize = 10
    const handlePositions = [
      { key: 'nw', x: x - handleSize/2, y: y - handleSize/2 },
      { key: 'ne', x: x + width - handleSize/2, y: y - handleSize/2 },
      { key: 'sw', x: x - handleSize/2, y: y + height - handleSize/2 },
      { key: 'se', x: x + width - handleSize/2, y: y + height - handleSize/2 }
    ]
    
    handlePositions.forEach(pos => {
      const handle = this.editableRoomAreas.get(`${roomId}_handle_${pos.key}`) as Phaser.GameObjects.Graphics
      if (handle) {
        handle.setPosition(pos.x, pos.y)
      }
    })
  }

  private clearEditableRoomAreas() {
    console.log('🎯 [Game] Clearing all editable room areas with DOM cleanup')
    this.editableRoomAreas.forEach((gameObject, key) => {
      if (gameObject) {
        console.log('🎯 [Game] Destroying room area object:', key)
        
        // Clean up DOM event listeners for room objects
        if ('getData' in gameObject) {
          const mouseMoveHandler = (gameObject as any).getData('mouseMoveHandler')
          const mouseUpHandler = (gameObject as any).getData('mouseUpHandler')
          
          if (mouseMoveHandler) {
            document.removeEventListener('mousemove', mouseMoveHandler)
            console.log('🎯 [Game] Removed mousemove listener for:', key)
          }
          if (mouseUpHandler) {
            document.removeEventListener('mouseup', mouseUpHandler)
            console.log('🎯 [Game] Removed mouseup listener for:', key)
          }
        }
        
        gameObject.destroy()
      }
    })
    this.editableRoomAreas.clear()
    console.log('🎯 [Game] All editable room areas cleared with DOM event cleanup')
  }

  // Old pointer event handlers - commented out in favor of built-in drag functionality
  /*
  private handleMeetingRoomPointerDown(pointer: Phaser.Input.Pointer) {
    // This method is now replaced by built-in Phaser drag events on Rectangle objects
  }

  private handleMeetingRoomPointerMove(pointer: Phaser.Input.Pointer) {
    // This method is now replaced by built-in Phaser drag events on Rectangle objects
  }

  private handleMeetingRoomPointerUp(pointer: Phaser.Input.Pointer) {
    // This method is now replaced by built-in Phaser drag events on Rectangle objects
  }
  */

  private updateRoomAreaVisuals(roomId: string, x: number, y: number, width: number, height: number, isDragging: boolean = false) {
    const rect = this.editableRoomAreas.get(roomId) as Phaser.GameObjects.Rectangle | undefined
    const label = this.editableRoomAreas.get(`${roomId}_label`) as Phaser.GameObjects.Text | undefined
    
    if (rect) {
      rect.setPosition(x + width/2, y + height/2)
      rect.setSize(width, height)
      
      if (isDragging) {
        rect.setFillStyle(0xffeb3b, 0.5)  // Yellow when dragging
        rect.setStrokeStyle(3, 0xffeb3b)
      } else {
        rect.setFillStyle(0xff9800, 0.3)  // Orange when normal
        rect.setStrokeStyle(3, 0xff9800)
      }
    }
    
    if (label) {
      label.setPosition(x + width/2, y + height/2)
    }
    
    // Update resize handles
    this.clearRoomHandles(roomId)
    this.createResizeHandles(roomId, x, y, width, height)
  }

  private clearRoomHandles(roomId: string) {
    const handleKeys = Array.from(this.editableRoomAreas.keys()).filter(key => key.includes(`${roomId}_handle_`))
    handleKeys.forEach(key => {
      const handle = this.editableRoomAreas.get(key)
      if (handle) {
        handle.destroy()
        this.editableRoomAreas.delete(key)
      }
    })
  }
}
