import { Client, Room } from 'colyseus.js'
import { IComputer, IOfficeState, IPlayer, IWhiteboard } from '../../../types/IOfficeState'
import { Message } from '../../../types/Messages'
import { IRoomData, RoomType } from '../../../types/Rooms'
import { ItemType } from '../../../types/Items'
import WebRTC from '../web/WebRTC'
import { phaserEvents, Event } from '../events/EventCenter'
import store from '../stores'
import { setSessionId, setPlayerNameMap, removePlayerNameMap } from '../stores/UserStore'
import {
    setLobbyJoined,
    setJoinedRoomData,
    setAvailableRooms,
    addAvailableRooms,
    removeAvailableRooms,
} from '../stores/RoomStore'
import {
    pushChatMessage,
    pushPlayerJoinedMessage,
    pushPlayerLeftMessage,
} from '../stores/ChatStore'
import { setWhiteboardUrls } from '../stores/WhiteboardStore'

import {
    addMeetingRoomFromServer,
    removeMeetingRoomFromServer,
    addMeetingRoomAreaFromServer,
    removeMeetingRoomAreaFromServer,
} from '../stores/MeetingRoomStore'

export default class Network {
    private client: Client
    private room?: Room<IOfficeState>
    private lobby!: Room
    webRTC?: WebRTC

    mySessionId!: string

    constructor() {
        const protocol = window.location.protocol.replace('http', 'ws')
        const endpoint =
            process.env.NODE_ENV === 'production'
                ? import.meta.env.VITE_SERVER_URL
                : `${protocol}//${window.location.hostname}:2567`
        this.client = new Client(endpoint)
        this.joinLobbyRoom().then(() => {
            store.dispatch(setLobbyJoined(true))
        })

        phaserEvents.on(Event.MY_PLAYER_NAME_CHANGE, this.updatePlayerName, this)
        phaserEvents.on(Event.MY_PLAYER_TEXTURE_CHANGE, this.updatePlayer, this)
        phaserEvents.on(Event.PLAYER_DISCONNECTED, this.playerStreamDisconnect, this)
    }

    /**
     * Method to join Colyseus' built-in LobbyRoom, which automatically notifies
     * connected clients whenever rooms with "realtime listing" have updates
     */
    async joinLobbyRoom() {
        this.lobby = await this.client.joinOrCreate(RoomType.LOBBY)

        this.lobby.onMessage('rooms', (rooms) => {
            store.dispatch(setAvailableRooms(rooms))
        })

        this.lobby.onMessage('+', ([roomId, room]) => {
            store.dispatch(addAvailableRooms({ roomId, room }))
        })

        this.lobby.onMessage('-', (roomId) => {
            store.dispatch(removeAvailableRooms(roomId))
        })
    }

    // Method to join the public lobby
    async joinOrCreatePublic() {
        this.room = await this.client.joinOrCreate(RoomType.PUBLIC)
        this.initialize()
    }

    // Method to join a custom room
    async joinCustomById(roomId: string, password: string | null) {
        this.room = await this.client.joinById(roomId, { password })
        this.initialize()
    }

    // Method to create a custom room
    async createCustom(roomData: IRoomData) {
        const { name, description, password, autoDispose } = roomData
        this.room = await this.client.create(RoomType.CUSTOM, {
            name,
            description,
            password,
            autoDispose,
        })
        this.initialize()
    }

    // Set up all network listeners before the game starts
    initialize() {
        if (!this.room) return

        this.lobby.leave()
        this.mySessionId = this.room.sessionId
        store.dispatch(setSessionId(this.room.sessionId))
        this.webRTC = new WebRTC(this.mySessionId, this)

        // Process existing players first
        this.room.state.players.forEach((player: IPlayer, key: string) => {
            if (player.name && player.name !== '') {
                store.dispatch(setPlayerNameMap({ id: key, name: player.name }))
            }
        })

        // New instance added to the players MapSchema
        this.room.state.players.onAdd = (player: IPlayer, key: string) => {
            // Track changes on every child object inside the players MapSchema
            player.onChange = (changes) => {
                changes.forEach((change) => {
                    const { field, value } = change
                    
                    // Only emit game events for other players, not myself
                    if (key !== this.mySessionId) {
                        phaserEvents.emit(Event.PLAYER_UPDATED, field, value, key)
                    }

                    // When a player finished setting up player name (including myself)
                    if (field === 'name' && value !== '') {
                        // Add to playerNameMap for all players (including myself)
                        store.dispatch(setPlayerNameMap({ id: key, name: value }))
                        
                        // Only emit events and messages for other players
                        if (key !== this.mySessionId) {
                            phaserEvents.emit(Event.PLAYER_JOINED, player, key)
                            store.dispatch(pushPlayerJoinedMessage(value))
                        }
                    }
                })
            }
        }

        // An instance removed from the players MapSchema
        this.room.state.players.onRemove = (player: IPlayer, key: string) => {
            phaserEvents.emit(Event.PLAYER_LEFT, key)
            this.webRTC?.deleteVideoStream(key)
            this.webRTC?.deleteOnCalledVideoStream(key)
            store.dispatch(pushPlayerLeftMessage(player.name))
            store.dispatch(removePlayerNameMap(key))
        }

        // New instance added to the computers MapSchema
        this.room.state.computers.onAdd = (computer: IComputer, key: string) => {
            // Track changes on every child object's connectedUser
            computer.connectedUser.onAdd = (item, index) => {
                phaserEvents.emit(Event.ITEM_USER_ADDED, item, key, ItemType.COMPUTER)
            }
            computer.connectedUser.onRemove = (item, index) => {
                phaserEvents.emit(Event.ITEM_USER_REMOVED, item, key, ItemType.COMPUTER)
            }
        }

        // New instance added to the whiteboards MapSchema
        this.room.state.whiteboards.onAdd = (whiteboard: IWhiteboard, key: string) => {
            store.dispatch(
                setWhiteboardUrls({
                    whiteboardId: key,
                    roomId: whiteboard.roomId,
                })
            )
            // Track changes on every child object's connectedUser
            whiteboard.connectedUser.onAdd = (item, index) => {
                phaserEvents.emit(Event.ITEM_USER_ADDED, item, key, ItemType.WHITEBOARD)
            }
            whiteboard.connectedUser.onRemove = (item, index) => {
                phaserEvents.emit(Event.ITEM_USER_REMOVED, item, key, ItemType.WHITEBOARD)
            }
        }

        // New instance added to the chatMessages ArraySchema
        this.room.state.chatMessages.onAdd = (item, index) => {
            store.dispatch(pushChatMessage(item))
        }

        // When the server sends room data
        this.room.onMessage(Message.SEND_ROOM_DATA, (content) => {
            store.dispatch(setJoinedRoomData(content))
        })

        // When a user sends a message
        this.room.onMessage(Message.ADD_CHAT_MESSAGE, ({ clientId, content }) => {
            phaserEvents.emit(Event.UPDATE_DIALOG_BUBBLE, clientId, content)
        })

        // When a peer disconnects with myPeer
        this.room.onMessage(Message.DISCONNECT_STREAM, (clientId: string) => {
            this.webRTC?.deleteOnCalledVideoStream(clientId)
        })

        // When a computer user stops sharing screen
        this.room.onMessage(Message.STOP_SCREEN_SHARE, (clientId: string) => {
            const computerState = store.getState().computer
            computerState.shareScreenManager?.onUserLeft(clientId)
        })

        this.room.onMessage('MEETING_ROOM_MANUAL_UPDATE', (data: any) => {
            // 更新前の状態をログ出力
            const currentState = store.getState().meetingRoom
            // Update meeting room
            if (data.room) {
                store.dispatch(addMeetingRoomFromServer(data.room))
            }

            // Update meeting room area
            if (data.area) {
                store.dispatch(addMeetingRoomAreaFromServer(data.area))
            }

            // 更新後の状態をログ出力
            setTimeout(() => {
                const updatedState = store.getState().meetingRoom
            }, 100)
        })

        // Set up meeting room listeners with safety checks
        this.setupMeetingRoomListeners()
    }

    // Safely set up meeting room listeners
    private setupMeetingRoomListeners() {
        // Check if meeting room state is immediately available
        if (
            this.room?.state?.meetingRoomState?.meetingRooms &&
            this.room?.state?.meetingRoomState?.meetingRoomAreas
        ) {
            this.attachMeetingRoomListeners()
            return
        }

        // Wait for meeting room state to be ready
        this.room?.onStateChange((state) => {
            if (state.meetingRoomState?.meetingRooms && state.meetingRoomState?.meetingRoomAreas) {
                this.attachMeetingRoomListeners()
            }
        })
    }

    // 修正されたattachMeetingRoomListenersメソッド
    private attachMeetingRoomListeners() {
        if (!this.room?.state?.meetingRoomState) {
            console.error('Cannot attach meeting room listeners: meetingRoomState not available')
            return
        }

        const meetingRooms = this.room.state.meetingRoomState.meetingRooms
        const meetingRoomAreas = this.room.state.meetingRoomState.meetingRoomAreas

        // 既存の meeting rooms を処理
        if (meetingRooms) {
            meetingRooms.forEach((room, key) => {
                if (
                    typeof key === 'string' &&
                    !key.startsWith('$') &&
                    key !== 'onAdd' &&
                    key !== 'onRemove'
                ) {
                    if (
                        room &&
                        typeof room === 'object' &&
                        !Array.isArray(room) &&
                        typeof room !== 'function'
                    ) {
                        this.handleMeetingRoomAdded(room, key)
                    }
                }
            })

            // 新しい meeting room の追加を監視
            meetingRooms.onAdd = (meetingRoom: any, key: string) => {
                this.handleMeetingRoomAdded(meetingRoom, key)
            }

            meetingRooms.onRemove = (meetingRoom: any, key: string) => {
                console.log('🗑️ [Network] Meeting room removed from server:', key)
                store.dispatch(removeMeetingRoomFromServer(key))
            }
        }

        // 既存の meeting room areas を処理
        if (meetingRoomAreas) {
            meetingRoomAreas.forEach((area, key) => {
                if (
                    typeof key === 'string' &&
                    !key.startsWith('$') &&
                    key !== 'onAdd' &&
                    key !== 'onRemove'
                ) {
                    if (
                        area &&
                        typeof area === 'object' &&
                        !Array.isArray(area) &&
                        typeof area !== 'function'
                    ) {
                        this.handleMeetingRoomAreaAdded(area, key)
                    }
                }
            })

            // 新しい meeting room area の追加を監視
            meetingRoomAreas.onAdd = (area: any, key: string) => {
                this.handleMeetingRoomAreaAdded(area, key)
            }

            meetingRoomAreas.onRemove = (area: any, key: string) => {
                console.log('🗑️ [Network] Meeting room area removed from server:', key)
                store.dispatch(removeMeetingRoomAreaFromServer(key))
            }
        }
    }

    private handleMeetingRoomAdded(meetingRoom: any, key: string) {
        if (!meetingRoom || typeof meetingRoom !== 'object') {
            console.error('Invalid meeting room object:', meetingRoom)
            return
        }

        const roomData = {
            id: key,
            name: meetingRoom.name || '',
            mode: meetingRoom.mode || 'open',
            hostUserId: meetingRoom.hostUserId || '',
            invitedUsers: meetingRoom.invitedUsers
                ? (Array.from(meetingRoom.invitedUsers) as string[])
                : [],
            participants: meetingRoom.participants
                ? (Array.from(meetingRoom.participants) as string[])
                : [],
        }

        try {
            store.dispatch(addMeetingRoomFromServer(roomData))

            if (typeof meetingRoom.onChange === 'function' && !meetingRoom._changeListenerAttached) {
                meetingRoom.onChange = (changes: any[]) => {
                    changes.forEach((change) => { })

                    const updatedRoomData = {
                        id: key,
                        name: meetingRoom.name || '',
                        mode: meetingRoom.mode || 'open',
                        hostUserId: meetingRoom.hostUserId || '',
                        invitedUsers: meetingRoom.invitedUsers
                            ? (Array.from(meetingRoom.invitedUsers) as string[])
                            : [],
                        participants: meetingRoom.participants
                            ? (Array.from(meetingRoom.participants) as string[])
                            : [],
                    }

                    store.dispatch(addMeetingRoomFromServer(updatedRoomData))
                }

                meetingRoom._changeListenerAttached = true
            } else if (meetingRoom._changeListenerAttached) {
            }
        } catch (e) {
            console.error('Failed to dispatch addMeetingRoomFromServer:', e)
        }
    }

    private handleMeetingRoomAreaAdded(area: any, key: string) {
        if (!area || typeof area !== 'object') {
            console.error('Invalid area object:', area)
            return
        }

        const areaData = {
            meetingRoomId: area.meetingRoomId || key,
            x: area.x || 0,
            y: area.y || 0,
            width: area.width || 100,
            height: area.height || 100,
        }


        try {
            store.dispatch(addMeetingRoomAreaFromServer(areaData))

            if (typeof area.onChange === 'function' && !area._changeListenerAttached) {

                area.onChange = (changes: any[]) => {

                    // 変更された値を詳細にログ出力
                    changes.forEach((change) => {
                    })

                    const updatedAreaData = {
                        meetingRoomId: area.meetingRoomId || key,
                        x: area.x || 0,
                        y: area.y || 0,
                        width: area.width || 100,
                        height: area.height || 100,
                    }

                    store.dispatch(addMeetingRoomAreaFromServer(updatedAreaData))
                }

                area._changeListenerAttached = true
            } else if (area._changeListenerAttached) {
            }
        } catch (e) {
            console.error('Failed to dispatch addMeetingRoomAreaFromServer:', e)
        }
    }

    // 定期的な状態同期チェック（オプション）
    private setupPeriodicSync() {
        setInterval(() => {
            if (this.room?.state?.meetingRoomState) {
                const serverRooms = this.room.state.meetingRoomState.meetingRooms
                const serverAreas = this.room.state.meetingRoomState.meetingRoomAreas
                const clientState = store.getState().meetingRoom
                if (serverRooms && serverAreas) {
                    serverRooms.forEach((room, key) => {
                        if (!clientState.meetingRooms[key]) {
                            this.handleMeetingRoomAdded(room, key)
                        }
                    })

                    serverAreas.forEach((area, key) => {
                        if (!clientState.meetingRoomAreas[key]) {
                            this.handleMeetingRoomAreaAdded(area, key)
                        }
                    })
                }
            }
        }, 5000) // 5秒ごとにチェック
    }

    // Method to update meeting room mode
    updateMeetingRoomMode(roomId: string, newMode: 'open' | 'private' | 'secret') {

        const currentState = store.getState().meetingRoom
        const currentRoom = currentState.meetingRooms[roomId]

        if (!currentRoom) {
            console.error(`Cannot update room mode ${roomId}: not found`)
            return
        }

        const updatedRoomData = {
            id: roomId,
            name: currentRoom.name,
            mode: newMode,
            hostUserId: currentRoom.hostUserId,
            invitedUsers: currentRoom.invitedUsers,
        }

        this.room?.send(Message.UPDATE_MEETING_ROOM, updatedRoomData)
    }

    // Method to update meeting room area
    updateMeetingRoomArea(
        roomId: string,
        areaUpdates: {
            x?: number
            y?: number
            width?: number
            height?: number
        }
    ) {

        const currentState = store.getState().meetingRoom
        const currentRoom = currentState.meetingRooms[roomId]
        const currentArea = currentState.meetingRoomAreas[roomId]

        if (!currentRoom || !currentArea) {
            console.error(`Cannot update room area ${roomId}: not found`)
            return
        }

        const updatedRoomData = {
            id: roomId,
            name: currentRoom.name,
            mode: currentRoom.mode,
            hostUserId: currentRoom.hostUserId,
            invitedUsers: currentRoom.invitedUsers,
            area: {
                x: areaUpdates.x !== undefined ? areaUpdates.x : currentArea.x,
                y: areaUpdates.y !== undefined ? areaUpdates.y : currentArea.y,
                width: areaUpdates.width !== undefined ? areaUpdates.width : currentArea.width,
                height: areaUpdates.height !== undefined ? areaUpdates.height : currentArea.height,
            },
        }

        this.room?.send(Message.UPDATE_MEETING_ROOM, updatedRoomData)
    }

    // Method to register event listener and call back function when a item user added
    onChatMessageAdded(callback: (playerId: string, content: string) => void, context?: any) {
        phaserEvents.on(Event.UPDATE_DIALOG_BUBBLE, callback, context)
    }

    // Method to register event listener and call back function when a item user added
    onItemUserAdded(
        callback: (playerId: string, key: string, itemType: ItemType) => void,
        context?: any
    ) {
        phaserEvents.on(Event.ITEM_USER_ADDED, callback, context)
    }

    // Method to register event listener and call back function when a item user removed
    onItemUserRemoved(
        callback: (playerId: string, key: string, itemType: ItemType) => void,
        context?: any
    ) {
        phaserEvents.on(Event.ITEM_USER_REMOVED, callback, context)
    }

    // Method to register event listener and call back function when a player joined
    onPlayerJoined(callback: (Player: IPlayer, key: string) => void, context?: any) {
        phaserEvents.on(Event.PLAYER_JOINED, callback, context)
    }

    // Method to register event listener and call back function when a player left
    onPlayerLeft(callback: (key: string) => void, context?: any) {
        phaserEvents.on(Event.PLAYER_LEFT, callback, context)
    }

    // Method to register event listener and call back function when myPlayer is ready to connect
    onMyPlayerReady(callback: (key: string) => void, context?: any) {
        phaserEvents.on(Event.MY_PLAYER_READY, callback, context)
    }

    // Method to register event listener and call back function when my video is connected
    onMyPlayerVideoConnected(callback: (key: string) => void, context?: any) {
        phaserEvents.on(Event.MY_PLAYER_VIDEO_CONNECTED, callback, context)
    }

    // Method to register event listener and call back function when a player updated
    onPlayerUpdated(
        callback: (field: string, value: number | string, key: string) => void,
        context?: any
    ) {
        phaserEvents.on(Event.PLAYER_UPDATED, callback, context)
    }

    // Method to send player updates to Colyseus server
    updatePlayer(currentX: number, currentY: number, currentAnim: string) {
        this.room?.send(Message.UPDATE_PLAYER, { x: currentX, y: currentY, anim: currentAnim })
    }

    // Method to send player name to Colyseus server
    updatePlayerName(currentName: string) {
        this.room?.send(Message.UPDATE_PLAYER_NAME, { name: currentName })
        // Also add my own name to the playerNameMap for UI purposes
        if (this.mySessionId && currentName) {
            store.dispatch(setPlayerNameMap({ id: this.mySessionId, name: currentName }))
        }
    }

    // Method to send ready-to-connect signal to Colyseus server
    readyToConnect() {
        this.room?.send(Message.READY_TO_CONNECT)
        phaserEvents.emit(Event.MY_PLAYER_READY)
    }

    // Method to send ready-to-connect signal to Colyseus server
    videoConnected() {
        this.room?.send(Message.VIDEO_CONNECTED)
        phaserEvents.emit(Event.MY_PLAYER_VIDEO_CONNECTED)
    }

    // Method to send stream-disconnection signal to Colyseus server
    playerStreamDisconnect(id: string) {
        this.room?.send(Message.DISCONNECT_STREAM, { clientId: id })
        this.webRTC?.deleteVideoStream(id)
    }

    connectToComputer(id: string) {
        this.room?.send(Message.CONNECT_TO_COMPUTER, { computerId: id })
    }

    disconnectFromComputer(id: string) {
        this.room?.send(Message.DISCONNECT_FROM_COMPUTER, { computerId: id })
    }

    connectToWhiteboard(id: string) {
        this.room?.send(Message.CONNECT_TO_WHITEBOARD, { whiteboardId: id })
    }

    disconnectFromWhiteboard(id: string) {
        this.room?.send(Message.DISCONNECT_FROM_WHITEBOARD, { whiteboardId: id })
    }

    onStopScreenShare(id: string) {
        this.room?.send(Message.STOP_SCREEN_SHARE, { computerId: id })
    }

    addChatMessage(content: string) {
        this.room?.send(Message.ADD_CHAT_MESSAGE, { content: content })
    }

    createMeetingRoom(roomData: {
        id: string
        name: string
        mode: 'open' | 'private' | 'secret'
        hostUserId: string
        invitedUsers: string[]
        area: { x: number; y: number; width: number; height: number }
    }) {
        this.room?.send(Message.CREATE_MEETING_ROOM, roomData)
    }

    // Update meeting room
    updateMeetingRoom(roomData: {
        id: string
        name: string
        mode: 'open' | 'private' | 'secret'
        hostUserId: string
        invitedUsers: string[]
        area?: { x: number; y: number; width: number; height: number }
    }) {
        this.room?.send(Message.UPDATE_MEETING_ROOM, roomData)
    }

    // Delete meeting room
    deleteMeetingRoom(roomId: string) {
        this.room?.send(Message.DELETE_MEETING_ROOM, { id: roomId })
    }

}
