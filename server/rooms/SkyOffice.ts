import bcrypt from 'bcrypt'
import { Room, Client, ServerError } from 'colyseus'
import { Dispatcher } from '@colyseus/command'
import { Player, OfficeState, Computer, Whiteboard } from './schema/OfficeState'
import { Message } from '../../types/Messages'
import { IRoomData } from '../../types/Rooms'
import { whiteboardRoomIds } from './schema/OfficeState'
import { MeetingRoom, MeetingRoomArea } from './schema/MeetingRoomState'
import * as fs from 'fs'
import * as path from 'path'
import PlayerUpdateCommand from './commands/PlayerUpdateCommand'
import PlayerUpdateNameCommand from './commands/PlayerUpdateNameCommand'
import {
    ComputerAddUserCommand,
    ComputerRemoveUserCommand,
} from './commands/ComputerUpdateArrayCommand'
import {
    WhiteboardAddUserCommand,
    WhiteboardRemoveUserCommand,
} from './commands/WhiteboardUpdateArrayCommand'
import ChatMessageUpdateCommand from './commands/ChatMessageUpdateCommand'

export class SkyOffice extends Room<OfficeState> {
    private dispatcher = new Dispatcher(this)
    private name: string
    private description: string
    private password: string | null = null
    private dataDir = path.join(__dirname, '../../data')
    private meetingRoomsFile = path.join(this.dataDir, 'meeting_rooms.json')

    async onCreate(options: IRoomData) {
        const { name, description, password, autoDispose } = options
        this.name = name
        this.description = description
        this.autoDispose = autoDispose

        let hasPassword = false
        if (password) {
            const salt = await bcrypt.genSalt(10)
            this.password = await bcrypt.hash(password, salt)
            hasPassword = true
        }
        this.setMetadata({ name, description, hasPassword })

        // Debug: Log before state initialization
        console.log('SkyOffice onCreate called')
        this.setState(new OfficeState())

        // Debug: Check meetingRoomState initialization
        console.log('OfficeState set, checking meetingRoomState...')
        console.log('meetingRoomState initialized:', !!this.state.meetingRoomState)
        console.log('meetingRooms exists:', !!this.state.meetingRoomState?.meetingRooms)
        console.log('meetingRoomAreas exists:', !!this.state.meetingRoomState?.meetingRoomAreas)

        // HARD-CODED: Add 5 computers in a room
        for (let i = 0; i < 5; i++) {
            this.state.computers.set(String(i), new Computer())
        }

        // HARD-CODED: Add 3 whiteboards in a room
        for (let i = 0; i < 3; i++) {
            this.state.whiteboards.set(String(i), new Whiteboard())
        }

        // Initialize default meeting room
        this.initializeDefaultMeetingRoom()
        
        // Load persisted meeting rooms
        this.loadMeetingRoomsFromFile()

        // when a player connect to a computer, add to the computer connectedUser array
        this.onMessage(Message.CONNECT_TO_COMPUTER, (client, message: { computerId: string }) => {
            this.dispatcher.dispatch(new ComputerAddUserCommand(), {
                client,
                computerId: message.computerId,
            })
        })

        // when a player disconnect from a computer, remove from the computer connectedUser array
        this.onMessage(Message.DISCONNECT_FROM_COMPUTER, (client, message: { computerId: string }) => {
            this.dispatcher.dispatch(new ComputerRemoveUserCommand(), {
                client,
                computerId: message.computerId,
            })
        })

        // when a player stop sharing screen
        this.onMessage(Message.STOP_SCREEN_SHARE, (client, message: { computerId: string }) => {
            const computer = this.state.computers.get(message.computerId)
            computer.connectedUser.forEach((id) => {
                this.clients.forEach((cli) => {
                    if (cli.sessionId === id && cli.sessionId !== client.sessionId) {
                        cli.send(Message.STOP_SCREEN_SHARE, client.sessionId)
                    }
                })
            })
        })

        // when a player connect to a whiteboard, add to the whiteboard connectedUser array
        this.onMessage(Message.CONNECT_TO_WHITEBOARD, (client, message: { whiteboardId: string }) => {
            this.dispatcher.dispatch(new WhiteboardAddUserCommand(), {
                client,
                whiteboardId: message.whiteboardId,
            })
        })

        // when a player disconnect from a whiteboard, remove from the whiteboard connectedUser array
        this.onMessage(
            Message.DISCONNECT_FROM_WHITEBOARD,
            (client, message: { whiteboardId: string }) => {
                this.dispatcher.dispatch(new WhiteboardRemoveUserCommand(), {
                    client,
                    whiteboardId: message.whiteboardId,
                })
            }
        )

        // when receiving updatePlayer message, call the PlayerUpdateCommand
        this.onMessage(
            Message.UPDATE_PLAYER,
            (client, message: { x: number; y: number; anim: string }) => {
                this.dispatcher.dispatch(new PlayerUpdateCommand(), {
                    client,
                    x: message.x,
                    y: message.y,
                    anim: message.anim,
                })
            }
        )

        // when receiving updatePlayerName message, call the PlayerUpdateNameCommand
        this.onMessage(Message.UPDATE_PLAYER_NAME, (client, message: { name: string }) => {
            this.dispatcher.dispatch(new PlayerUpdateNameCommand(), {
                client,
                name: message.name,
            })
        })

        // when a player is ready to connect, call the PlayerReadyToConnectCommand
        this.onMessage(Message.READY_TO_CONNECT, (client) => {
            const player = this.state.players.get(client.sessionId)
            if (player) player.readyToConnect = true
        })

        // when a player is ready to connect, call the PlayerReadyToConnectCommand
        this.onMessage(Message.VIDEO_CONNECTED, (client) => {
            const player = this.state.players.get(client.sessionId)
            if (player) player.videoConnected = true
        })

        // when a player disconnect a stream, broadcast the signal to the other player connected to the stream
        this.onMessage(Message.DISCONNECT_STREAM, (client, message: { clientId: string }) => {
            this.clients.forEach((cli) => {
                if (cli.sessionId === message.clientId) {
                    cli.send(Message.DISCONNECT_STREAM, client.sessionId)
                }
            })
        })

        // when a player send a chat message, update the message array and broadcast to all connected clients except the sender
        this.onMessage(Message.ADD_CHAT_MESSAGE, (client, message: { content: string }) => {
            // update the message array (so that players join later can also see the message)
            this.dispatcher.dispatch(new ChatMessageUpdateCommand(), {
                client,
                content: message.content,
            })

            // broadcast to all currently connected clients except the sender (to render in-game dialog on top of the character)
            this.broadcast(
                Message.ADD_CHAT_MESSAGE,
                { clientId: client.sessionId, content: message.content },
                { except: client }
            )
        })

        // Meeting Room Message Handlers
        console.log('🏗️ [SkyOffice] Setting up meeting room message handlers...')
        this.onMessage(
            Message.CREATE_MEETING_ROOM,
            (
                client,
                message: {
                    id: string
                    name: string
                    mode: 'open' | 'private' | 'secret'
                    hostUserId: string
                    invitedUsers: string[]
                    area: { x: number; y: number; width: number; height: number }
                }
            ) => {
                console.log('SkyOffice: CREATE_MEETING_ROOM message received:', message)
                // Safety check
                if (!this.state.meetingRoomState) {
                    console.error('meetingRoomState is not initialized!')
                    return
                }

                if (!this.state.meetingRoomState.meetingRooms) {
                    console.error('meetingRooms is not initialized!')
                    return
                }

                if (!this.state.meetingRoomState.meetingRoomAreas) {
                    console.error('meetingRoomAreas is not initialized!')
                    return
                }
                console.log('Creating meeting room:', message)

                // Create a new meeting room
                const meetingRoom = new MeetingRoom()
                meetingRoom.id = message.id
                meetingRoom.name = message.name
                meetingRoom.mode = message.mode
                meetingRoom.hostUserId = message.hostUserId
                // Initialize participants and invited users
                message.invitedUsers.forEach((userId) => {
                    meetingRoom.invitedUsers.push(userId)
                })

                this.state.meetingRoomState.meetingRooms.set(message.id, meetingRoom)

                // Create a new meeting room area
                const area = new MeetingRoomArea()
                area.meetingRoomId = message.id
                area.x = message.area.x
                area.y = message.area.y
                area.width = message.area.width
                area.height = message.area.height

                this.state.meetingRoomState.meetingRoomAreas.set(message.id, area)

                console.log(`Meeting room created: ${message.name} (${message.id})`)
                
                // Save to file after creation
                this.saveMeetingRoomsToFile()
            }
        )

        this.onMessage(
            Message.UPDATE_MEETING_ROOM,
            (
                client,
                message: {
                    id: string
                    name: string
                    mode: 'open' | 'private' | 'secret'
                    hostUserId: string
                    invitedUsers: string[]
                    area?: { x: number; y: number; width: number; height: number }
                }
            ) => {
                console.log('=== UPDATE_MEETING_ROOM received ===')
                console.log('Client:', client.sessionId)
                console.log('Message:', message)

                // Safety check
                if (!this.state.meetingRoomState) {
                    console.error('meetingRoomState is not initialized!')
                    return
                }

                const oldMeetingRoom = this.state.meetingRoomState.meetingRooms.get(message.id)
                if (oldMeetingRoom) {
                    console.log('Before update:', {
                        name: oldMeetingRoom.name,
                        mode: oldMeetingRoom.mode,
                        hostUserId: oldMeetingRoom.hostUserId,
                        invitedUsersCount: oldMeetingRoom.invitedUsers.length,
                    })

                    // 新しいインスタンスを生成
                    const newMeetingRoom = new MeetingRoom()
                    newMeetingRoom.id = message.id
                    newMeetingRoom.name = message.name
                    newMeetingRoom.mode = message.mode
                    newMeetingRoom.hostUserId = message.hostUserId
                    message.invitedUsers.forEach((userId) => {
                        newMeetingRoom.invitedUsers.push(userId)
                    })
                    // 必要ならparticipantsもコピー
                    oldMeetingRoom.participants.forEach((id) => {
                        newMeetingRoom.participants.push(id)
                    })

                    // Remove and re-add the room to force Colyseus change detection
                    this.state.meetingRoomState.meetingRooms.delete(message.id)
                    this.state.meetingRoomState.meetingRooms.set(message.id, newMeetingRoom)

                    // Handle area updates similarly
                    if (message.area) {
                        console.log('Updating area for room:', message.id)
                        const oldArea = this.state.meetingRoomState.meetingRoomAreas.get(message.id)
                        // 新しいインスタンスを生成
                        const newArea = new MeetingRoomArea()
                        newArea.meetingRoomId = message.id
                        newArea.x = message.area.x
                        newArea.y = message.area.y
                        newArea.width = message.area.width
                        newArea.height = message.area.height
                        // 必要ならoldAreaの他のフィールドもコピー
                        // Remove and re-add the area
                        this.state.meetingRoomState.meetingRoomAreas.delete(message.id)
                        this.state.meetingRoomState.meetingRoomAreas.set(message.id, newArea)
                    }

                    console.log('After update:', {
                        name: newMeetingRoom.name,
                        mode: newMeetingRoom.mode,
                        hostUserId: newMeetingRoom.hostUserId,
                        invitedUsersCount: newMeetingRoom.invitedUsers.length,
                    })

                    console.log(`Meeting room updated successfully: ${message.name} (${message.id})`)
                    
                    // Save to file after successful update
                    this.saveMeetingRoomsToFile()
                } else {
                    console.error(`Meeting room not found for update: ${message.id}`)
                    console.log('Available rooms:')
                    this.state.meetingRoomState.meetingRooms.forEach((room, key) => {
                        console.log(`  - ${key}: ${room.name}`)
                    })
                }
            }
        )
        console.log('🗑️ [SkyOffice] Setting up DELETE_MEETING_ROOM handler...')
        this.onMessage(Message.DELETE_MEETING_ROOM, (client, message: { id: string }) => {
            console.log('=== DELETE_MEETING_ROOM received ===')
            console.log('Client:', client.sessionId)
            console.log('Room ID to delete:', message.id)
            
            // Safety check
            if (!this.state.meetingRoomState) {
                console.error('meetingRoomState is not initialized!')
                return
            }

            const roomExists = this.state.meetingRoomState.meetingRooms.has(message.id)
            const areaExists = this.state.meetingRoomState.meetingRoomAreas.has(message.id)
            
            console.log('Before deletion:', {
                roomExists,
                areaExists,
                totalRooms: this.state.meetingRoomState.meetingRooms.size,
                totalAreas: this.state.meetingRoomState.meetingRoomAreas.size
            })

            // Delete the meeting room from the state
            if (roomExists) {
                this.state.meetingRoomState.meetingRooms.delete(message.id)
                console.log(`✅ Meeting room deleted from server: ${message.id}`)
            } else {
                console.warn(`❌ Meeting room not found for deletion: ${message.id}`)
            }

            // Delete the meeting room area from the state
            if (areaExists) {
                this.state.meetingRoomState.meetingRoomAreas.delete(message.id)
                console.log(`✅ Meeting room area deleted from server: ${message.id}`)
            } else {
                console.warn(`❌ Meeting room area not found for deletion: ${message.id}`)
            }
            
            console.log('After deletion:', {
                totalRooms: this.state.meetingRoomState.meetingRooms.size,
                totalAreas: this.state.meetingRoomState.meetingRoomAreas.size
            })
            
            // Save to file after deletion
            this.saveMeetingRoomsToFile()
            console.log('=== DELETE_MEETING_ROOM completed ===')
        })
    }

    async onAuth(client: Client, options: { password: string | null }) {
        if (this.password) {
            const validPassword = await bcrypt.compare(options.password, this.password)
            if (!validPassword) {
                throw new ServerError(403, 'Password is incorrect!')
            }
        }
        return true
    }

    onJoin(client: Client, options: any) {
        console.log(`=== CLIENT JOINED ===`)
        console.log(`Client ${client.sessionId} joined`)
        console.log('Current meetingRooms count:', this.state.meetingRoomState?.meetingRooms?.size || 0)
        console.log(
            'Current meetingRoomAreas count:',
            this.state.meetingRoomState?.meetingRoomAreas?.size || 0
        )

        // Log existing meeting rooms for new client
        if (this.state.meetingRoomState?.meetingRooms) {
            console.log('Existing meeting rooms for new client:')
            this.state.meetingRoomState.meetingRooms.forEach((room, key) => {
                console.log(`  - ${key}: ${room.name} (mode: ${room.mode}, host: ${room.hostUserId})`)
            })
        }

        if (this.state.meetingRoomState?.meetingRoomAreas) {
            console.log('Existing meeting room areas for new client:')
            this.state.meetingRoomState.meetingRoomAreas.forEach((area, key) => {
                console.log(`  - ${key}: x=${area.x}, y=${area.y}, w=${area.width}, h=${area.height}`)
            })
        }
        
        console.log('=== END CLIENT JOINED ===')

        this.state.players.set(client.sessionId, new Player())
        client.send(Message.SEND_ROOM_DATA, {
            id: this.roomId,
            name: this.name,
            description: this.description,
        })
    }

    onLeave(client: Client, consented: boolean) {
        if (this.state.players.has(client.sessionId)) {
            this.state.players.delete(client.sessionId)
        }
        this.state.computers.forEach((computer) => {
            if (computer.connectedUser.has(client.sessionId)) {
                computer.connectedUser.delete(client.sessionId)
            }
        })
        this.state.whiteboards.forEach((whiteboard) => {
            if (whiteboard.connectedUser.has(client.sessionId)) {
                whiteboard.connectedUser.delete(client.sessionId)
            }
        })

        // Meeting room participant cleanup
        if (this.state.meetingRoomState?.meetingRooms) {
            this.state.meetingRoomState.meetingRooms.forEach((meetingRoom) => {
                const participantIndex = meetingRoom.participants.findIndex((id) => id === client.sessionId)
                if (participantIndex !== -1) {
                    meetingRoom.participants.deleteAt(participantIndex)
                }
            })
        }
    }

    /**
     * Initialize default meeting room when the office room is first created
     * This runs only once per room instance, not per client connection
     */
    private initializeDefaultMeetingRoom() {
        console.log('Initializing default meeting room...')
        if (!this.state.meetingRoomState) {
            console.error('meetingRoomState is not initialized!')
            return
        }

        // Create default meeting room
        const defaultMeetingRoom = new MeetingRoom()
        defaultMeetingRoom.id = 'default-meeting-room'
        defaultMeetingRoom.name = 'Meeting Room'
        defaultMeetingRoom.mode = 'open'
        defaultMeetingRoom.hostUserId = 'system' // System created room
        // No invited users for default room - it's open to all

        this.state.meetingRoomState.meetingRooms.set('default-meeting-room', defaultMeetingRoom)

        // Create corresponding meeting room area
        const defaultArea = new MeetingRoomArea()
        defaultArea.meetingRoomId = 'default-meeting-room'
        defaultArea.x = 192
        defaultArea.y = 482
        defaultArea.width = 448
        defaultArea.height = 296

        this.state.meetingRoomState.meetingRoomAreas.set('default-meeting-room', defaultArea)

        console.log('Default meeting room initialized:', {
            id: 'default-meeting-room',
            name: 'Meeting Room',
            area: { x: 192, y: 482, width: 448, height: 296 },
        })
    }

    /**
     * Save meeting rooms to JSON file for persistence
     */
    private saveMeetingRoomsToFile() {
        try {
            // Create data directory if it doesn't exist
            if (!fs.existsSync(this.dataDir)) {
                fs.mkdirSync(this.dataDir, { recursive: true })
            }

            const roomsData = {
                rooms: {},
                areas: {},
                lastUpdated: new Date().toISOString()
            }

            // Convert Colyseus MapSchema to plain objects
            if (this.state.meetingRoomState?.meetingRooms) {
                this.state.meetingRoomState.meetingRooms.forEach((room, key) => {
                    roomsData.rooms[key] = {
                        id: room.id,
                        name: room.name,
                        mode: room.mode,
                        hostUserId: room.hostUserId,
                        invitedUsers: Array.from(room.invitedUsers),
                        participants: Array.from(room.participants)
                    }
                })
            }

            if (this.state.meetingRoomState?.meetingRoomAreas) {
                this.state.meetingRoomState.meetingRoomAreas.forEach((area, key) => {
                    roomsData.areas[key] = {
                        meetingRoomId: area.meetingRoomId,
                        x: area.x,
                        y: area.y,
                        width: area.width,
                        height: area.height
                    }
                })
            }

            fs.writeFileSync(this.meetingRoomsFile, JSON.stringify(roomsData, null, 2))
            console.log('📁 Meeting rooms saved to file:', this.meetingRoomsFile)
        } catch (error) {
            console.error('❌ Error saving meeting rooms to file:', error)
        }
    }

    /**
     * Load meeting rooms from JSON file
     */
    private loadMeetingRoomsFromFile() {
        try {
            if (!fs.existsSync(this.meetingRoomsFile)) {
                console.log('📁 No meeting rooms file found, using defaults only')
                return
            }

            const fileContent = fs.readFileSync(this.meetingRoomsFile, 'utf8')
            const roomsData = JSON.parse(fileContent)

            console.log('📁 Loading meeting rooms from file...')

            // Load rooms
            if (roomsData.rooms) {
                Object.entries(roomsData.rooms).forEach(([key, roomData]: [string, any]) => {
                    // Skip default room since it's already created
                    if (key === 'default-meeting-room') {
                        console.log('⏭️ Skipping default room, already exists')
                        return
                    }

                    const meetingRoom = new MeetingRoom()
                    meetingRoom.id = roomData.id
                    meetingRoom.name = roomData.name
                    meetingRoom.mode = roomData.mode
                    meetingRoom.hostUserId = roomData.hostUserId
                    
                    // Restore invited users
                    if (roomData.invitedUsers) {
                        roomData.invitedUsers.forEach((userId: string) => {
                            meetingRoom.invitedUsers.push(userId)
                        })
                    }
                    
                    // Don't restore participants - they'll rejoin when they reconnect
                    
                    this.state.meetingRoomState!.meetingRooms.set(key, meetingRoom)
                    console.log(`📥 Loaded room: ${roomData.name} (${roomData.mode})`)
                })
            }

            // Load areas
            if (roomsData.areas) {
                Object.entries(roomsData.areas).forEach(([key, areaData]: [string, any]) => {
                    // Skip default area since it's already created
                    if (key === 'default-meeting-room') {
                        console.log('⏭️ Skipping default area, already exists')
                        return
                    }

                    const area = new MeetingRoomArea()
                    area.meetingRoomId = areaData.meetingRoomId
                    area.x = areaData.x
                    area.y = areaData.y
                    area.width = areaData.width
                    area.height = areaData.height

                    this.state.meetingRoomState!.meetingRoomAreas.set(key, area)
                    console.log(`📥 Loaded area: ${key} (${areaData.x},${areaData.y})`)
                })
            }

            console.log(`📁 Meeting rooms loaded from ${roomsData.lastUpdated}`)
        } catch (error) {
            console.error('❌ Error loading meeting rooms from file:', error)
        }
    }

    onDispose() {
        // Save meeting rooms before disposing
        this.saveMeetingRoomsToFile()
        
        this.state.whiteboards.forEach((whiteboard) => {
            if (whiteboardRoomIds.has(whiteboard.roomId)) whiteboardRoomIds.delete(whiteboard.roomId)
        })

        console.log('room', this.roomId, 'disposing...')
        this.dispatcher.stop()
    }
}
