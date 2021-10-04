import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export const userSlice = createSlice({
  name: 'user',
  initialState: {
    sessionId: '',
    counter: 0,
  },
  reducers: {
    setSessionId: (state, action: PayloadAction<string>) => {
      state.sessionId = action.payload
    },
    increment: (state) => {
      state.counter++
    },
    decrement: (state) => {
      state.counter--
    },
  },
})

export const { setSessionId, increment, decrement } = userSlice.actions

export default userSlice.reducer
