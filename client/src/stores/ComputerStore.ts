import Peer from 'peerjs'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import ShareScreenManager from '../web/ShareScreenManager'
import phaserGame from '../PhaserGame'
import Game from '../scenes/Game'
import { sanitizeId } from '../util'

interface ComputerState {
  computerDialogOpen: boolean
  computerId: null | string
  myStream: null | MediaStream
  peerStreams: Map<
    string,
    {
      stream: MediaStream
      call: Peer.MediaConnection
    }
  >
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
      if (!state.shareScreenManager) {
        state.shareScreenManager = new ShareScreenManager(action.payload.myUserId)
      }
      const game = phaserGame.scene.keys.game as Game
      game.disableKeys()
      state.shareScreenManager.onOpen()
      state.computerDialogOpen = true
      state.computerId = action.payload.computerId
    },
    closeComputerDialog: (state) => {
      // Tell server the computer dialog is closed.
      const game = phaserGame.scene.keys.game as Game
      game.enableKeys()
      game.network.disconnectFromComputer(state.computerId!)
      for (const { call } of state.peerStreams.values()) {
        call.close()
      }
      state.shareScreenManager?.onClose()
      state.computerDialogOpen = false
      state.myStream = null
      state.computerId = null
      state.peerStreams.clear()
    },
    setMyStream: (state, action: PayloadAction<null | MediaStream>) => {
      state.myStream = action.payload
    },
    addVideoStream: (
      state,
      action: PayloadAction<{ id: string; call: Peer.MediaConnection; stream: MediaStream }>
    ) => {
      state.peerStreams.set(sanitizeId(action.payload.id), {
        call: action.payload.call,
        stream: action.payload.stream,
      })
    },
    removeVideoStream: (state, action: PayloadAction<string>) => {
      state.peerStreams.delete(sanitizeId(action.payload))
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
