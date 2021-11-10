import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { sanitizeId } from '../util'

export const userSlice = createSlice({
  name: 'user',
  initialState: {
    sessionId: '',
    connected: false,
    videoConnected: false,
    videoConnectionWarning: true,
    loggedIn: false,
    playerNameMap: new Map<string, string>(),
  },
  reducers: {
    setSessionId: (state, action: PayloadAction<string>) => {
      state.sessionId = action.payload
    },
    setConnected: (state, action: PayloadAction<boolean>) => {
      state.connected = action.payload
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
    closeVideoConnectionWarning: (state) => {
      state.videoConnectionWarning = false
    },
  },
})

export const {
  setSessionId,
  setConnected,
  setVideoConnected,
  setLoggedIn,
  setPlayerNameMap,
  removePlayerNameMap,
  closeVideoConnectionWarning,
} = userSlice.actions

export default userSlice.reducer
