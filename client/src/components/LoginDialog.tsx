import React, { useState } from 'react'
import styled from 'styled-components'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Avatar from '@mui/material/Avatar'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import ArrowRightIcon from '@mui/icons-material/ArrowRight'

import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import RefreshIcon from '@mui/icons-material/Refresh'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'

import { GENDERS, Gender, buildAvatar } from '../../../types/Avatar'
import { Portrait } from '../avatars/Portrait'
import { useAppSelector, useAppDispatch } from '../hooks'
import { setLoggedIn } from '../stores/UserStore'
import { getAvatarString, getColorByString } from '../util'

import phaserGame from '../PhaserGame'
import Game from '../scenes/Game'

const Wrapper = styled.form`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #222639;
  border-radius: 16px;
  padding: 36px 60px;
  box-shadow: 0px 0px 5px #0000006f;
`

const Title = styled.p`
  margin: 5px;
  font-size: 20px;
  color: #c2c2c2;
  text-align: center;
`

const RoomName = styled.div`
  max-width: 500px;
  max-height: 120px;
  overflow-wrap: anywhere;
  overflow-y: auto;
  display: flex;
  gap: 10px;
  justify-content: center;
  align-items: center;

  h3 {
    font-size: 24px;
    color: #eee;
  }
`

const RoomDescription = styled.div`
  max-width: 500px;
  max-height: 150px;
  overflow-wrap: anywhere;
  overflow-y: auto;
  font-size: 16px;
  color: #c2c2c2;
  display: flex;
  justify-content: center;
`

const SubTitle = styled.h3`
  width: 160px;
  font-size: 16px;
  color: #eee;
  text-align: center;
`

const Content = styled.div`
  display: flex;
  margin: 36px 0;
`

const Left = styled.div`
  margin-right: 48px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;

  .avatar-preview {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    background: #dbdbe0;
    border-radius: 8px;
    padding: 10px;
  }


`

const Right = styled.div`
  width: 300px;
`

const Bottom = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`

const Warning = styled.div`
  margin-top: 30px;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 3px;
`

const newSeed = () => Math.floor(Math.random() * 0xffffff)

export default function LoginDialog() {
  const [name, setName] = useState<string>('')
  const [gender, setGender] = useState<Gender>('n')
  const [seed, setSeed] = useState<number>(newSeed)
  const avatar = buildAvatar(gender, seed)
  const [nameFieldEmpty, setNameFieldEmpty] = useState<boolean>(false)
  const dispatch = useAppDispatch()
  const videoConnected = useAppSelector((state) => state.user.videoConnected)
  const roomJoined = useAppSelector((state) => state.room.roomJoined)
  const roomName = useAppSelector((state) => state.room.roomName)
  const roomDescription = useAppSelector((state) => state.room.roomDescription)
  const game = phaserGame.scene.keys.game as Game

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (name === '') {
      setNameFieldEmpty(true)
    } else if (roomJoined) {
      game.registerKeys()
      game.myPlayer.setPlayerName(name)
      game.myPlayer.setAvatar(avatar)
      game.network.readyToConnect()
      dispatch(setLoggedIn(true))
    }
  }

  return (
    <Wrapper onSubmit={handleSubmit}>
      <Title>Joining</Title>
      <RoomName>
        <Avatar style={{ background: getColorByString(roomName) }}>
          {getAvatarString(roomName)}
        </Avatar>
        <h3>{roomName}</h3>
      </RoomName>
      <RoomDescription>
        <ArrowRightIcon /> {roomDescription}
      </RoomDescription>
      <Content>
        <Left>
          <SubTitle>Your avatar</SubTitle>
          <div className="avatar-preview">
            <Portrait avatar={avatar} size={140} />
            <Tooltip title="Generate another">
              <IconButton
                aria-label="generate another avatar"
                color="secondary"
                onClick={() => setSeed(newSeed())}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </div>
          <ToggleButtonGroup
            exclusive
            size="small"
            color="secondary"
            value={gender}
            onChange={(_event, value) => value && setGender(value)}
          >
            {GENDERS.map((option) => (
              <ToggleButton key={option.value} value={option.value}>
                {option.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Left>
        <Right>
          <TextField
            autoFocus
            fullWidth
            label="Name"
            variant="outlined"
            color="secondary"
            error={nameFieldEmpty}
            helperText={nameFieldEmpty && 'Name is required'}
            onInput={(e) => {
              setName((e.target as HTMLInputElement).value)
            }}
          />
          {!videoConnected && (
            <Warning>
              <Alert variant="outlined" severity="warning">
                <AlertTitle>Warning</AlertTitle>
                No webcam/mic connected - <strong>connect one for best experience!</strong>
              </Alert>
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => {
                  game.network.webRTC?.getUserMedia()
                }}
              >
                Connect Webcam
              </Button>
            </Warning>
          )}

          {videoConnected && (
            <Warning>
              <Alert variant="outlined">Webcam connected!</Alert>
            </Warning>
          )}
        </Right>
      </Content>
      <Bottom>
        <Button variant="contained" color="secondary" size="large" type="submit">
          Join
        </Button>
      </Bottom>
    </Wrapper>
  )
}
