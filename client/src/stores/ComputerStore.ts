import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import ShareScreenManager from '../web/ShareScreenManager'
import phaserGame from '../PhaserGame'
import Game from '../scenes/Game'

interface ComputerState {
  computerDialogOpen: boolean
  computerId: null | string
  myStream: null | MediaStream
  peerStreams: Map<string, MediaStream>
  shareScreenManager: null | ShareScreenManager
}

const initialState: ComputerState = {
  computerDialogOpen: false,
  computerId: null,
  myStream: null,
  peerStreams: new Map(),
  shareScreenManager: null,
}

export const computerSlice = createSlice({
  name: 'computer',
  initialState,
  reducers: {
    openComputerDialog: (
      state,
      action: PayloadAction<{ computerId: string; myUserId: string }>
    ) => {
      state.shareScreenManager = new ShareScreenManager(action.payload.myUserId)
      state.computerDialogOpen = true
      state.computerId = action.payload.computerId
    },
    closeComputerDialog: (state) => {
      state.shareScreenManager?.onDestroy()
      state.shareScreenManager = null
      state.computerDialogOpen = false
      state.myStream = null
      state.computerId = null
      // TODO(kevinshen56714) Tell server the computer dialog is closed.
      const game = phaserGame.scene.keys.game as Game
      console.log(game)
      // game.todo
    },
    setMyStream: (state, action: PayloadAction<null | MediaStream>) => {
      state.myStream = action.payload
    },
    addVideoStream: (state, action: PayloadAction<{ id: string; stream: MediaStream }>) => {
      state.peerStreams.set(action.payload.id, action.payload.stream)
    },
    removeVideoStream: (state, action: PayloadAction<string>) => {
      state.peerStreams.delete(action.payload)
    },
  },
})

export const {
  closeComputerDialog,
  openComputerDialog,
  setMyStream,
  addVideoStream,
  removeVideoStream,
} = computerSlice.actions

export default computerSlice.reducer
