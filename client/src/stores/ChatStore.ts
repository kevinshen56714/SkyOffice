import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { IChatMessage, IMeetingRoomChatMessage } from '../../../types/IOfficeState'
import phaserGame from '../PhaserGame'
import Game from '../scenes/Game'

export enum MessageType {
  PLAYER_JOINED,
  PLAYER_LEFT,
  REGULAR_MESSAGE,
}

export enum MeetingRoomMessageType {
  REGULAR_MESSAGE,
  USER_JOINED,
  USER_LEFT,
  PERMISSION_CHANGED,
}

export const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    chatMessages: new Array<{ messageType: MessageType; chatMessage: IChatMessage }>(),
    meetingRoomChatMessages: {} as Record<string, Array<{ messageType: MeetingRoomMessageType; chatMessage: IMeetingRoomChatMessage }>>,
    currentMeetingRoomId: null as string | null,
    focused: false,
    showChat: true,
  },
  reducers: {
    pushChatMessage: (state, action: PayloadAction<IChatMessage>) => {
      state.chatMessages.push({
        messageType: MessageType.REGULAR_MESSAGE,
        chatMessage: action.payload,
      })
    },
    pushPlayerJoinedMessage: (state, action: PayloadAction<string>) => {
      state.chatMessages.push({
        messageType: MessageType.PLAYER_JOINED,
        chatMessage: {
          createdAt: new Date().getTime(),
          author: action.payload,
          content: 'joined the lobby',
        } as IChatMessage,
      })
    },
    pushPlayerLeftMessage: (state, action: PayloadAction<string>) => {
      state.chatMessages.push({
        messageType: MessageType.PLAYER_LEFT,
        chatMessage: {
          createdAt: new Date().getTime(),
          author: action.payload,
          content: 'left the lobby',
        } as IChatMessage,
      })
    },
    setFocused: (state, action: PayloadAction<boolean>) => {
      const game = phaserGame.scene.keys.game as Game
      action.payload ? game.disableKeys() : game.enableKeys()
      state.focused = action.payload
    },
    setShowChat: (state, action: PayloadAction<boolean>) => {
      state.showChat = action.payload
    },
    pushMeetingRoomChatMessage: (state, action: PayloadAction<{ meetingRoomId: string; message: IMeetingRoomChatMessage }>) => {
      const { meetingRoomId, message } = action.payload
      console.log('📥 [ChatStore] Received meeting room message:', {
        roomId: meetingRoomId,
        author: message.author,
        content: message.content,
        timestamp: new Date(message.createdAt).toLocaleTimeString()
      })
      if (!state.meetingRoomChatMessages[meetingRoomId]) {
        state.meetingRoomChatMessages[meetingRoomId] = []
      }
      state.meetingRoomChatMessages[meetingRoomId].push({
        messageType: MeetingRoomMessageType.REGULAR_MESSAGE,
        chatMessage: message,
      })
    },
    setMeetingRoomChatHistory: (state, action: PayloadAction<{ meetingRoomId: string; messages: IMeetingRoomChatMessage[] }>) => {
      const { meetingRoomId, messages } = action.payload
      console.log('📚 [ChatStore] Setting chat history for room:', {
        roomId: meetingRoomId,
        messageCount: messages.length
      })
      state.meetingRoomChatMessages[meetingRoomId] = messages.map(msg => ({
        messageType: MeetingRoomMessageType.REGULAR_MESSAGE,
        chatMessage: msg,
      }))
    },
    setCurrentMeetingRoomId: (state, action: PayloadAction<string | null>) => {
      state.currentMeetingRoomId = action.payload
    },
    pushMeetingRoomUserJoinedMessage: (state, action: PayloadAction<{ meetingRoomId: string; userName: string }>) => {
      const { meetingRoomId, userName } = action.payload
      if (!state.meetingRoomChatMessages[meetingRoomId]) {
        state.meetingRoomChatMessages[meetingRoomId] = []
      }
      state.meetingRoomChatMessages[meetingRoomId].push({
        messageType: MeetingRoomMessageType.USER_JOINED,
        chatMessage: {
          author: userName,
          content: 'joined the meeting room',
          createdAt: Date.now(),
          meetingRoomId,
          messageId: `join_${Date.now()}_${Math.random()}`,
        } as IMeetingRoomChatMessage,
      })
    },
    pushMeetingRoomUserLeftMessage: (state, action: PayloadAction<{ meetingRoomId: string; userName: string }>) => {
      const { meetingRoomId, userName } = action.payload
      if (!state.meetingRoomChatMessages[meetingRoomId]) {
        state.meetingRoomChatMessages[meetingRoomId] = []
      }
      state.meetingRoomChatMessages[meetingRoomId].push({
        messageType: MeetingRoomMessageType.USER_LEFT,
        chatMessage: {
          author: userName,
          content: 'left the meeting room',
          createdAt: Date.now(),
          meetingRoomId,
          messageId: `leave_${Date.now()}_${Math.random()}`,
        } as IMeetingRoomChatMessage,
      })
    },
  },
})

export const {
  pushChatMessage,
  pushPlayerJoinedMessage,
  pushPlayerLeftMessage,
  setFocused,
  setShowChat,
  pushMeetingRoomChatMessage,
  setMeetingRoomChatHistory,
  setCurrentMeetingRoomId,
  pushMeetingRoomUserJoinedMessage,
  pushMeetingRoomUserLeftMessage,
} = chatSlice.actions

export default chatSlice.reducer
