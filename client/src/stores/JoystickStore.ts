import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export const userSlice = createSlice({
  name: 'joystick',
  initialState: {
    showJoystick: window.innerWidth < 650,
    showButtonE: false,
    showButtonR: false,
  },
  reducers: {
    setShowJoystick: (state, action: PayloadAction<boolean>) => {
      state.showJoystick = action.payload
    },
    setShowButtonE: (state, action: PayloadAction<boolean>) => {
      state.showButtonE = action.payload
    },
    setShowButtonR: (state, action: PayloadAction<boolean>) => {
      state.showButtonR = action.payload
    },
  },
})

export const { setShowJoystick, setShowButtonE, setShowButtonR } = userSlice.actions

export default userSlice.reducer
