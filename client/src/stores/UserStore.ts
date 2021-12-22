import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { sanitizeId } from '../util'

export const userSlice = createSlice({
  name: 'user',
  initialState: {
    roomJoined: false,
    roomName: '',
    roomDescription: '',
    sessionId: '',
    videoConnected: false,
    loggedIn: false,
    playerNameMap: new Map<string, string>(),
  },
  reducers: {
    setRoomJoined: (state, action: PayloadAction<boolean>) => {
      state.roomJoined = action.payload
    },
    setRoomData: (state, action: PayloadAction<{ name: string; description: string }>) => {
      state.roomName = action.payload.name
      state.roomDescription = action.payload.description
    },
    setSessionId: (state, action: PayloadAction<string>) => {
      state.sessionId = action.payload
    },
    setVideoConnected: (state, action: PayloadAction<boolean>) => {
      state.videoConnected = action.payload
    },
    setLoggedIn: (state, action: PayloadAction<boolean>) => {
      state.loggedIn = action.payload
    },
    setPlayerNameMap: (state, action: PayloadAction<{ id: string; name: string }>) => {
      state.playerNameMap.set(sanitizeId(action.payload.id), action.payload.name)
    },
    removePlayerNameMap: (state, action: PayloadAction<string>) => {
      state.playerNameMap.delete(sanitizeId(action.payload))
    },
  },
})

export const {
  setRoomJoined,
  setRoomData,
  setSessionId,
  setVideoConnected,
  setLoggedIn,
  setPlayerNameMap,
  removePlayerNameMap,
} = userSlice.actions

export default userSlice.reducer
