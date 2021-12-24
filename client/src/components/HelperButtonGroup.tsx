import React, { useState } from 'react'
import { BackgroundMode, getInitialBackgroundMode } from '../util'
import styled from 'styled-components'
import Fab from '@mui/material/Fab'
import IconButton from '@mui/material/IconButton'
import Avatar from '@mui/material/Avatar'
import Tooltip from '@mui/material/Tooltip'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import ShareIcon from '@mui/icons-material/Share'
import LightModeIcon from '@mui/icons-material/LightMode'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import CloseIcon from '@mui/icons-material/Close'
import LightbulbIcon from '@mui/icons-material/Lightbulb'
import ArrowRightIcon from '@mui/icons-material/ArrowRight'

import { useAppSelector } from '../hooks'
import { getAvatarString, getColorByString } from '../util'

import phaserGame from '../PhaserGame'
import Bootstrap from '../scenes/Bootstrap'

const Backdrop = styled.div`
  position: fixed;
  display: flex;
  gap: 10px;
  bottom: 16px;
  right: 16px;
  align-items: flex-end;

  .wrapper-group {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
`

const Wrapper = styled.div`
  width: 550px;
  position: relative;
  font-size: 16px;
  color: #eee;
  background: #222639;
  box-shadow: 0px 0px 5px #0000006f;
  border-radius: 16px;
  padding: 15px 35px 15px 15px;
  display: flex;
  flex-direction: column;
  align-items: center;

  .close {
    position: absolute;
    top: 15px;
    right: 15px;
  }

  .tip {
    margin-left: 12px;
  }
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

const RoomName = styled.div`
  margin: 10px 20px;
  max-width: 460px;
  max-height: 150px;
  overflow-wrap: anywhere;
  overflow-y: auto;
  display: flex;
  gap: 10px;
  justify-content: center;

  h3 {
    font-size: 24px;
    color: #eee;
  }
`

const RoomDescription = styled.div`
  margin: 0 20px;
  max-width: 460px;
  max-height: 150px;
  overflow-wrap: anywhere;
  overflow-y: auto;
  font-size: 16px;
  color: #c2c2c2;
  display: flex;
  justify-content: center;
`

export default function HelperButtonGroup() {
  const [backgroundMode, setBackgroundMode] = useState(getInitialBackgroundMode())
  const [showControlGuide, setShowControlGuide] = useState(false)
  const [showRoomInfo, setShowRoomInfo] = useState(false)
  const roomJoined = useAppSelector((state) => state.room.roomJoined)
  const roomId = useAppSelector((state) => state.room.roomId)
  const roomName = useAppSelector((state) => state.room.roomName)
  const roomDescription = useAppSelector((state) => state.room.roomDescription)

  const handleBackgroundChange = () => {
    const newMode =
      backgroundMode === BackgroundMode.DAY ? BackgroundMode.NIGHT : BackgroundMode.DAY

    setBackgroundMode(newMode)
    const bootstrap = phaserGame.scene.keys.bootstrap as Bootstrap
    bootstrap.changeBackgroundMode(newMode)
  }

  return (
    <Backdrop>
      <div className="wrapper-group">
        {showRoomInfo && (
          <Wrapper>
            <IconButton className="close" onClick={() => setShowRoomInfo(false)} size="small">
              <CloseIcon />
            </IconButton>
            <RoomName>
              <Avatar style={{ background: getColorByString(roomName) }}>
                {getAvatarString(roomName)}
              </Avatar>
              <h3>{roomName}</h3>
            </RoomName>
            <RoomDescription>
              <ArrowRightIcon /> ID: {roomId}
            </RoomDescription>
            <RoomDescription>
              <ArrowRightIcon /> Description: {roomDescription}
            </RoomDescription>
            <p className="tip">
              <LightbulbIcon />
              Shareable link coming up 😄
            </p>
          </Wrapper>
        )}
        {showControlGuide && (
          <Wrapper>
            <Title>Controls</Title>
            <IconButton className="close" onClick={() => setShowControlGuide(false)} size="small">
              <CloseIcon />
            </IconButton>
            <ul>
              <li>
                <strong>Arrow keys</strong> to move
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
            <p className="tip">
              <LightbulbIcon />
              Video connection will start if you are close to someone else
            </p>
          </Wrapper>
        )}
      </div>
      <ButtonGroup>
        {roomJoined && (
          <Tooltip title="Room Info" placement="left">
            <Fab size="small" onClick={() => setShowRoomInfo(!showRoomInfo)}>
              <ShareIcon />
            </Fab>
          </Tooltip>
        )}
        <Tooltip title="Control Guide" placement="left">
          <Fab size="small" onClick={() => setShowControlGuide(!showControlGuide)}>
            <HelpOutlineIcon />
          </Fab>
        </Tooltip>
        <Tooltip title="Switch Background Theme" placement="left">
          <Fab size="small" onClick={handleBackgroundChange}>
            {backgroundMode === BackgroundMode.DAY ? <DarkModeIcon /> : <LightModeIcon />}
          </Fab>
        </Tooltip>
      </ButtonGroup>
    </Backdrop>
  )
}
