import { createSlice } from '@reduxjs/toolkit'

interface WhiteboardState {
  whiteboardDialogOpen: boolean
}

const initialState: WhiteboardState = {
  whiteboardDialogOpen: false,
}

export const whiteboardSlice = createSlice({
  name: 'whiteboard',
  initialState,
  reducers: {
    openWhiteboardDialog: (state) => {
      state.whiteboardDialogOpen = true
    },
    closeWhiteboardDialog: (state) => {
      state.whiteboardDialogOpen = false
    },
  },
})

export const { openWhiteboardDialog, closeWhiteboardDialog } = whiteboardSlice.actions

export default whiteboardSlice.reducer
