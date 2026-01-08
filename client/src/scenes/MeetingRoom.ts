import Phaser from 'phaser'
import MyPlayer from '../characters/MyPlayer'
import store from '../stores'
import { MeetingRoom, MeetingRoomArea } from '../stores/MeetingRoomStore'
import { setCurrentMeetingRoomId, pushMeetingRoomUserJoinedMessage, pushMeetingRoomUserLeftMessage } from '../stores/ChatStore'

export class MeetingRoomManager {
  private scene: Phaser.Scene
  private myPlayer: MyPlayer
  private rooms: MeetingRoom[] = []
  private canAccess: boolean = true
  private meetingRoomAreas: MeetingRoomArea[] = []
  private meetingRoomZones: Phaser.GameObjects.Zone[] = []
  private prevRooms: MeetingRoom[] = []
  private prevAreas: MeetingRoomArea[] = []

  //graphics for meeting room MeetingRoomAreas
  private meetAreaGraphics!: Phaser.GameObjects.Graphics
  private meetAreaOverlay!: Phaser.GameObjects.Graphics
  private meetingRoomColliders: Map<string, Phaser.Physics.Arcade.Collider> = new Map()

  constructor(scene: Phaser.Scene, myPlayer: MyPlayer) {
    this.scene = scene
    this.myPlayer = myPlayer
    this.initializeGraphics()
    this.setupStoreSubscription()
  }
  
  private initializeGraphics() {
    this.meetAreaGraphics = this.scene.add.graphics()
    this.meetAreaOverlay = this.scene.add.graphics()
  }

  private setupStoreSubscription() {
    this.meetingRoomAreas = Object.values(store.getState().meetingRoom.meetingRoomAreas)
    this.rooms = Object.values(store.getState().meetingRoom.meetingRooms) ?? []

    console.log('🏗️ [MeetingRoomManager] Initial setup:', {
      areasCount: this.meetingRoomAreas.length,
      roomsCount: this.rooms.length,
      areas: this.meetingRoomAreas.map(a => ({ id: a.meetingRoomId, x: a.x, y: a.y, w: a.width, h: a.height })),
      rooms: this.rooms.map(r => ({ id: r.id, name: r.name, mode: r.mode }))
    })

    this.drawMeetingRoomAreas()
    this.createMeetingRoomZones()
    this.updatePrevStates()

    store.subscribe(() => {
      const newRooms = Object.values(store.getState().meetingRoom.meetingRooms) ?? []
      const newAreas = Object.values(store.getState().meetingRoom.meetingRoomAreas) ?? []

      if (this.hasAreasChanged(newAreas)) {
        this.meetingRoomAreas = newAreas
        this.drawMeetingRoomAreas()
        this.createMeetingRoomZones()
      }

      if (this.hasRoomsChanged(newRooms)) {
        this.rooms = newRooms
        this.handleRoomUpdates()
        this.drawMeetingRoomAreas()
      }

      this.updatePrevStates()
    })
  }

  checkPlayerInMeetingRoom(x: number, y: number): void {
    const area = this.meetingRoomAreas.find(
      (a) => x >= a.x && x <= a.x + a.width && y >= a.y && y <= a.y + a.height
    )

    const nextId = area ? area.meetingRoomId : null
    if (nextId !== this.myPlayer.currentMeetingRoomId) {
      this.handleMeetingRoomTransition(nextId)
    }
  }

  private handleMeetingRoomTransition(nextId: string | null): void {
    console.log('🚪 [MeetingRoomManager] Room transition:', {
      nextId,
      availableRooms: this.rooms.map(r => ({ id: r.id, name: r.name })),
      currentRoomId: this.myPlayer.currentMeetingRoomId,
      playerPosition: { x: this.myPlayer.x, y: this.myPlayer.y },
      roomAreas: this.meetingRoomAreas.map(a => ({ 
        id: a.meetingRoomId, 
        area: `(${a.x}-${a.x + a.width}, ${a.y}-${a.y + a.height})` 
      }))
    })

    if (nextId) {
      const room = this.rooms.find((r) => r.id === nextId)
      if (room) {
        console.log('✅ [MeetingRoomManager] Entering room:', { id: room.id, name: room.name })
        this.myPlayer.currentMeetingRoomId = nextId
        store.dispatch(setCurrentMeetingRoomId(nextId))
        this.scene.events.emit('enter-meeting-room', nextId)
      } else {
        console.warn('❌ [MeetingRoomManager] Room not found:', nextId)
      }
    } else {
      const previousRoomId = this.myPlayer.currentMeetingRoomId
      if (previousRoomId) {
        console.log('🚪 [MeetingRoomManager] Leaving room:', previousRoomId)
        this.myPlayer.currentMeetingRoomId = null
        store.dispatch(setCurrentMeetingRoomId(null))
        this.scene.events.emit('leave-meeting-room', previousRoomId)
      }
    }
  }

  // Check if areas have changed
  private hasAreasChanged(newAreas: MeetingRoomArea[]): boolean {
    if (this.prevAreas.length !== newAreas.length) {
      return true
    }

    for (let i = 0; i < newAreas.length; i++) {
      const newArea = newAreas[i]
      const prevArea = this.prevAreas[i]

      if (
        !prevArea ||
        newArea.meetingRoomId !== prevArea.meetingRoomId ||
        newArea.x !== prevArea.x ||
        newArea.y !== prevArea.y ||
        newArea.width !== prevArea.width ||
        newArea.height !== prevArea.height
      ) {
        return true
      }
    }

    return false
  }

  // Check if rooms have changed
  private hasRoomsChanged(newRooms: MeetingRoom[]): boolean {
        if (this.prevRooms.length !== newRooms.length) {
            return true
        }

        for (let i = 0; i < newRooms.length; i++) {
            const newRoom = newRooms[i]
            const prevRoom = this.prevRooms[i]

            if (
                !prevRoom ||
                newRoom.id !== prevRoom.id ||
                newRoom.mode !== prevRoom.mode ||
                newRoom.hostUserId !== prevRoom.hostUserId ||
                JSON.stringify(newRoom.invitedUsers) !== JSON.stringify(prevRoom.invitedUsers)
            ) {
                return true
            }
        }

        return false
    }

    // Get access permission for the area where the player is currently located
    private getCurrentAreaAccess(): boolean {
        const currentArea = this.meetingRoomAreas.find((area) => {
            const playerX = this.myPlayer.x
            const playerY = this.myPlayer.y
            return (
                playerX >= area.x &&
                playerX <= area.x + area.width &&
                playerY >= area.y &&
                playerY <= area.y + area.height
            )
        })

        if (!currentArea) {
            return true // Always accessible outside of areas
        }

        const room = this.rooms.find((r) => r.id === currentArea.meetingRoomId)
        if (!room) {
            return true // Accessible if room is not found
        }

        return this.canAccessMeetingRoom(room)
    }

    // Update canAccess state based on current area
    private updateCanAccessState(): void {
        const newCanAccess = this.getCurrentAreaAccess()
        console.log(`[MeetingRoomManager] Can access current area: ${newCanAccess}`)
        if (this.canAccess !== newCanAccess) {
            this.canAccess = newCanAccess
            this.scene.events.emit('meeting-room-access-changed', {
                canAccess: newCanAccess
            })
        }
    }

    private canAccessMeetingRoom(room: MeetingRoom): boolean {
        const myUserId = this.myPlayer.playerId

        if (room.mode === 'private') {
          if (
            (room.hostUserId !== myUserId && !Array.isArray(room.invitedUsers)) ||
            !room.invitedUsers.includes(myUserId)
          ) {
            return false
          }
        } else if (room.mode === 'secret') {
          if (room.hostUserId !== myUserId) {
            return false
          }
        }
        
        return true
    }

  private createMeetingRoomZones(): void {
    // delete existing colliders and zones
    for (const collider of this.meetingRoomColliders.values()) {
      collider.destroy()
    }
    this.meetingRoomColliders.clear()

    for (const zone of this.meetingRoomZones) {
      zone.destroy()
    }
    this.meetingRoomZones = []

    // make zones for each meeting room area
    this.meetingRoomAreas.forEach((area) => {
      const centerX = area.x + area.width / 2
      const centerY = area.y + area.height / 2
      const zone = this.scene.add.zone(centerX, centerY, area.width, area.height)
      this.scene.physics.add.existing(zone, true)
      zone.setName(area.meetingRoomId)
      this.meetingRoomZones.push(zone)

      const room = this.rooms.find((r) => r.id === area.meetingRoomId)
      if (!room) return

      if (!this.canAccessMeetingRoom(room)) {
        const collider = this.scene.physics.add.collider(
          [this.myPlayer, this.myPlayer.playerContainer], // Assuming myPlayer has a playerContainer],
          zone
        )
        this.meetingRoomColliders.set(room.id, collider)
      }
    })

    console.log('[MeetingRoomManager] Created zones:', this.meetingRoomZones.length)
  }


  private drawMeetingRoomAreas(): void {
        // Don't draw if in visual edit mode
        if (this.isVisualEditMode) {
            console.log('🎯 [MeetingRoomManager] Skipping drawing - in visual edit mode')
            return
        }
        
        this.meetAreaGraphics.clear()
        this.meetAreaOverlay.clear()

        this.meetAreaGraphics.setDepth(1000)
        this.meetAreaOverlay.setDepth(1001)

        for (const area of this.meetingRoomAreas) {
            const room = this.rooms.find((r) => r.id === area.meetingRoomId)

            if (room) {
                this.drawMeetingRoomArea(area)
            }
        }

        console.log('[MeetingRoomManager] Drew room areas:', this.meetingRoomAreas.length)
    }

    // Methods to hide/show room areas for visual editing mode
    private isVisualEditMode = false
    
    public hideRoomAreas(): void {
        console.log('🎯 [MeetingRoomManager] Hiding room areas for visual edit mode')
        this.isVisualEditMode = true
        this.meetAreaGraphics.setVisible(false)
        this.meetAreaOverlay.setVisible(false)
    }

    public showRoomAreas(): void {
        console.log('🎯 [MeetingRoomManager] Showing room areas - exiting visual edit mode')
        this.isVisualEditMode = false
        this.meetAreaGraphics.setVisible(true)
        this.meetAreaOverlay.setVisible(true)
        this.drawMeetingRoomAreas()
    }

    private drawMeetingRoomArea(area: MeetingRoomArea): void {
        const room = this.rooms.find(r => r.id === area.meetingRoomId)
        if (!room) return
        
        const canAccess = this.canAccessMeetingRoom(room)
        
        if (canAccess) {
            this.meetAreaGraphics.lineStyle(3, 0x00ff00, 1)
        } else {
            this.meetAreaGraphics.lineStyle(3, 0xff0000, 1)
            this.showRestrictedText(area)
        }
        this.meetAreaGraphics.strokeRect(area.x, area.y, area.width, area.height)
    }

  private showRestrictedText(area: MeetingRoomArea): void {
    const centerX = area.x + area.width / 2
    const centerY = area.y + area.height / 2

    const restrictedText = this.scene.add.text(centerX, centerY, 'cannot access', {
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 8, y: 4 },
    })
    restrictedText.setOrigin(0.5)
    restrictedText.setDepth(1002)

    this.scene.time.delayedCall(3000, () => {
      if (restrictedText && restrictedText.active) {
        restrictedText.destroy()
      }
    })
  }

  private handleRoomUpdates(): void {
    for (const room of this.rooms) {
      const prevRoom = this.prevRooms.find((r) => r.id === room.id)
      if (!prevRoom) continue // if the room is new, skip

      //check your access permission changing
      const prevCanAccess = this.canAccessMeetingRoom(prevRoom)
      const nowCanAccess = this.canAccessMeetingRoom(room)
      if (prevCanAccess !== nowCanAccess) {
        this.onMeetingRoomPermissionChanged(room.id, nowCanAccess)
      }

      // check mode change from private/secret to open
      if ((prevRoom.mode === 'private' || prevRoom.mode === 'secret') && room.mode === 'open') {
        this.onMeetingRoomPermissionChanged(room.id, true)
      }
    }
  }

  private onMeetingRoomPermissionChanged(roomId: string, canAccess: boolean): void {
    const collider = this.meetingRoomColliders.get(roomId)
    console.log('[MeetingRoomManager] Permission changed:', roomId, canAccess)

    if (canAccess && collider) {
      collider.destroy()
      this.meetingRoomColliders.delete(roomId)
    } else if (!canAccess && !collider) {
      const zone = this.meetingRoomZones.find((z) => z.name === roomId)
      if (zone) {
        const newCollider = this.scene.physics.add.collider(
          [this.myPlayer, this.myPlayer.playerContainer],
          zone
        )
        this.meetingRoomColliders.set(roomId, newCollider)
      }
    }
  }
  private updatePrevRooms(): void {
    this.prevRooms = this.rooms.map((r) => ({ ...r }))
  }

  update(): void {}

  private updatePrevStates(): void {
    this.prevRooms = JSON.parse(JSON.stringify(this.rooms))
    this.prevAreas = JSON.parse(JSON.stringify(this.meetingRoomAreas))
  }

  destroy(): void {
    for (const collider of this.meetingRoomColliders.values()) {
      collider.destroy()
    }

    this.meetingRoomColliders.clear()
    for (const zone of this.meetingRoomZones) {
      zone.destroy()
    }
    this.meetingRoomZones = []

    this.meetAreaGraphics?.destroy()
    this.meetAreaOverlay?.destroy()
  }
}
