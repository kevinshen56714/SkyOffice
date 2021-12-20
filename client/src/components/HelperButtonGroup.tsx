import React, { useState } from 'react'
import { BackgroundMode, getInitialBackgroundMode } from '../util'
import styled from 'styled-components'
import Fab from '@mui/material/Fab'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import LightModeIcon from '@mui/icons-material/LightMode'
import DarkModeIcon from '@mui/icons-material/DarkMode'

import phaserGame from '../PhaserGame'
import Bootstrap from '../scenes/Bootstrap'

const Backdrop = styled.div`
  position: fixed;
  display: flex;
  flex-direction: column;
  gap: 10px;
  bottom: 16px;
  right: 16px;
`

export default function HelperButtonGroup() {
  const [backgroundMode, setBackgroundMode] = useState(getInitialBackgroundMode())

  const handleBackgroundChange = () => {
    const newMode =
      backgroundMode === BackgroundMode.DAY ? BackgroundMode.NIGHT : BackgroundMode.DAY

    setBackgroundMode(newMode)
    const bootstrap = phaserGame.scene.keys.bootstrap as Bootstrap
    bootstrap.changeBackgroundMode(newMode)
  }

  return (
    <Backdrop>
      <Fab size="small" onClick={handleBackgroundChange}>
        {backgroundMode === BackgroundMode.DAY ? <DarkModeIcon /> : <LightModeIcon />}
      </Fab>
      <Fab size="small">
        <HelpOutlineIcon />
      </Fab>
    </Backdrop>
  )
}
