import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { IChatMessage } from '../../../types/IOfficeState'

export enum MessageType {
  PLAYER_JOINED,
  PLAYER_LEFT,
  REGULAR_MESSAGE,
}

export const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    chatMessages: new Array<{ messageType: MessageType; chatMessage: IChatMessage }>(),
  },
  reducers: {
    pushChatMessage: (
      state,
      action: PayloadAction<{ messageType: MessageType; chatMessage: IChatMessage }>
    ) => {
      state.chatMessages.push(action.payload)
    },
  },
})

export const { pushChatMessage } = chatSlice.actions

export default chatSlice.reducer
