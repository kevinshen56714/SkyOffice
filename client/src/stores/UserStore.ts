import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { sanitizeId } from '../util'
import { BackgroundMode } from '../../../types/BackgroundMode'

import phaserGame from '../PhaserGame'
import Bootstrap from '../scenes/Bootstrap'

import network from '../services/Network'

export function getInitialBackgroundMode() {
  const currentHour = new Date().getHours()
  return currentHour > 6 && currentHour <= 18 ? BackgroundMode.DAY : BackgroundMode.NIGHT
}

export const userSlice = createSlice({
  name: 'user',
  initialState: {
    name: '',
    texture: '',
    backgroundMode: getInitialBackgroundMode(),
    sessionId: '',
    videoConnected: false,
    loggedIn: false,
    playerNameMap: new Map<string, string>(),
  },
  reducers: {
    setMyPlayerProps: (state, action: PayloadAction<{ name: string; texture: string }>) => {
      const currentScene = (phaserGame.scene.keys.bootstrap as Bootstrap).currentScene

      if (action.payload.name !== state.name) {
        state.name = action.payload.name
        currentScene?.myPlayer.setPlayerName(state.name)
      }

      if (action.payload.texture !== state.texture) {
        state.texture = action.payload.texture
        currentScene?.myPlayer.setPlayerTexture(state.texture)
      }
    },
    toggleBackgroundMode: (state) => {
      const newMode =
        state.backgroundMode === BackgroundMode.DAY ? BackgroundMode.NIGHT : BackgroundMode.DAY

      state.backgroundMode = newMode
      const bootstrap = phaserGame.scene.keys.bootstrap as Bootstrap
      bootstrap.changeBackgroundMode(newMode)
    },
    setSessionId: (state, action: PayloadAction<string>) => {
      state.sessionId = action.payload
    },
    setVideoConnected: (state, action: PayloadAction<boolean>) => {
      state.videoConnected = action.payload
    },
    logIn: (state) => {
      state.loggedIn = true

      const currentScene = (phaserGame.scene.keys.bootstrap as Bootstrap).currentScene
      currentScene?.enableKeys()
      network.readyToConnect()
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
  setMyPlayerProps,
  toggleBackgroundMode,
  setSessionId,
  setVideoConnected,
  logIn,
  setPlayerNameMap,
  removePlayerNameMap,
} = userSlice.actions

export default userSlice.reducer
