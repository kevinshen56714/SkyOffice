import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { sanitizeId } from '../util'

export const userSlice = createSlice({
  name: 'user',
  initialState: {
    roomJoined: false,
    sessionId: '',
    videoConnected: false,
    loggedIn: false,
    playerNameMap: new Map<string, string>(),
  },
  reducers: {
    setRoomJoined: (state, action: PayloadAction<boolean>) => {
      state.roomJoined = action.payload
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
  setSessionId,
  setVideoConnected,
  setLoggedIn,
  setPlayerNameMap,
  removePlayerNameMap,
} = userSlice.actions

export default userSlice.reducer
