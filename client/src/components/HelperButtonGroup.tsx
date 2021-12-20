import React, { useState } from 'react'
import { BackgroundMode, getInitialBackgroundMode } from '../util'
import styled from 'styled-components'
import Fab from '@mui/material/Fab'
import IconButton from '@mui/material/IconButton'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import LightModeIcon from '@mui/icons-material/LightMode'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import CloseIcon from '@mui/icons-material/Close'

import phaserGame from '../PhaserGame'
import Bootstrap from '../scenes/Bootstrap'

const Backdrop = styled.div`
  position: fixed;
  display: flex;
  gap: 10px;
  bottom: 16px;
  right: 16px;
  align-items: flex-end;
`

const ButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`

const Title = styled.h3`
  font-size: 24px;
  color: #eee;
  text-align: center;
`

const ControlGuide = styled.div`
  position: relative;
  font-size: 16px;
  color: #eee;
  background: #222639;
  border-radius: 16px;
  padding: 15px 35px 15px 15px;

  .close {
    position: absolute;
    top: 15px;
    right: 15px;
  }
`

export default function HelperButtonGroup() {
  const [backgroundMode, setBackgroundMode] = useState(getInitialBackgroundMode())
  const [showControlGuide, setShowControlGuide] = useState(false)

  const handleBackgroundChange = () => {
    const newMode =
      backgroundMode === BackgroundMode.DAY ? BackgroundMode.NIGHT : BackgroundMode.DAY

    setBackgroundMode(newMode)
    const bootstrap = phaserGame.scene.keys.bootstrap as Bootstrap
    bootstrap.changeBackgroundMode(newMode)
  }

  return (
    <Backdrop>
      {showControlGuide && (
        <ControlGuide>
          <Title>Controls</Title>
          <IconButton className="close" onClick={() => setShowControlGuide(false)} size="small">
            <CloseIcon />
          </IconButton>
          <ul>
            <li>
              <strong>Arrow keys</strong> to move (video chat will start if you are close to someone
              else)
            </li>
            <li>
              <strong>E</strong> to sit down (when facing a chair)
            </li>
            <li>
              <strong>R</strong> to use computer to screen share (when facing a computer)
            </li>
            <li>
              <strong>Enter</strong> to open chat
            </li>
            <li>
              <strong>ESC</strong> to close chat
            </li>
          </ul>
        </ControlGuide>
      )}
      <ButtonGroup>
        <Fab size="small" onClick={handleBackgroundChange}>
          {backgroundMode === BackgroundMode.DAY ? <DarkModeIcon /> : <LightModeIcon />}
        </Fab>
        <Fab size="small" onClick={() => setShowControlGuide(!showControlGuide)}>
          <HelpOutlineIcon />
        </Fab>
      </ButtonGroup>
    </Backdrop>
  )
}
