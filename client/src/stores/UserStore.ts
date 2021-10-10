import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export const userSlice = createSlice({
  name: 'user',
  initialState: {
    sessionId: '',
    connected: false,
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
    setLoggedIn: (state, action: PayloadAction<boolean>) => {
      state.loggedIn = action.payload
    },
    setPlayerNameMap: (state, action: PayloadAction<{ id: string; name: string }>) => {
      state.playerNameMap.set(action.payload.id, action.payload.name)
    },
    removePlayerNameMap: (state, action: PayloadAction<string>) => {
      state.playerNameMap.delete(action.payload)
    },
  },
})

export const { setSessionId, setConnected, setLoggedIn, setPlayerNameMap, removePlayerNameMap } =
  userSlice.actions

export default userSlice.reducer
