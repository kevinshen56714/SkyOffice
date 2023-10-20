import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { sanitizeId } from '../util'
import { BackgroundMode } from '../../../types/BackgroundMode'

import phaserGame from '../PhaserGame'
import Bootstrap from '../scenes/Bootstrap'

export function getInitialBackgroundMode() {
  const currentHour = new Date().getHours()
  return currentHour > 6 && currentHour <= 18 ? BackgroundMode.DAY : BackgroundMode.NIGHT
}

export const userSlice = createSlice({
  name: 'user',
  initialState: {
    backgroundMode: getInitialBackgroundMode(),
    sessionId: '',
    videoConnected: false,
    devices: new Array<any>(),
    microphonePermissionGranted: false,
    cameraPermissionGranted: false,
    videoDeviceId: localStorage.getItem('videoDeviceId') || '',
    audioInputDeviceId: localStorage.getItem('audioInputDeviceId') || '',
    audioOutputDeviceId: localStorage.getItem('audioOutputDeviceId') || '',
    loggedIn: false,
    playerNameMap: new Map<string, string>(),
    showJoystick: window.innerWidth < 650,
  },
  reducers: {
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
    setMicrophonePermissionGranted: (state, action: PayloadAction<boolean>) => {
      state.microphonePermissionGranted = action.payload
    },
    setCameraPermissionGranted: (state, action: PayloadAction<boolean>) => {
      state.cameraPermissionGranted = action.payload
    },
    setDevices: (state, action: PayloadAction<any[]>) => {
      state.devices = action.payload
    },
    setVideoDeviceId: (state, action: PayloadAction<string>) => {
      state.videoDeviceId = action.payload
      localStorage.setItem('videoDeviceId', action.payload)
    },
    setAudioInputDeviceId: (state, action: PayloadAction<string>) => {
      state.audioInputDeviceId = action.payload
      localStorage.setItem('audioInputDeviceId', action.payload)
    },
    setAudioOutputDeviceId: (state, action: PayloadAction<string>) => {
      state.audioOutputDeviceId = action.payload
      localStorage.setItem('audioOutputDeviceId', action.payload)
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
    setShowJoystick: (state, action: PayloadAction<boolean>) => {
      state.showJoystick = action.payload
    },
  },
})

export const {
  toggleBackgroundMode,
  setSessionId,
  setMicrophonePermissionGranted,
  setCameraPermissionGranted,
  setDevices,
  setVideoDeviceId,
  setAudioOutputDeviceId,
  setAudioInputDeviceId,
  setLoggedIn,
  setPlayerNameMap,
  removePlayerNameMap,
  setShowJoystick,
} = userSlice.actions

export default userSlice.reducer
