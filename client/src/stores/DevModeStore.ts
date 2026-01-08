import { createSlice } from '@reduxjs/toolkit'

interface DevmodeState {
  isDevMode: boolean
}

const initialState: DevmodeState = {
  isDevMode: false,
}

export const devModeSlice = createSlice({
  name: 'devmode',
  initialState,
  reducers: {
    toggleDevMode: (state) => {
      state.isDevMode = !state.isDevMode
      console.log(`🛠️ [DevMode] ${state.isDevMode ? 'ENABLED' : 'DISABLED'} - Debug logging ${state.isDevMode ? 'ON' : 'OFF'}`)
    },
    setDevmode: (state, action) => {
      const previousState = state.isDevMode
      state.isDevMode = action.payload
      if (previousState !== action.payload) {
        console.log(`🛠️ [DevMode] ${state.isDevMode ? 'ENABLED' : 'DISABLED'} - Debug logging ${state.isDevMode ? 'ON' : 'OFF'}`)
      }
    },
  },
})

export const { toggleDevMode, setDevmode } = devModeSlice.actions

export default devModeSlice.reducer
