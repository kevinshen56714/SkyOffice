import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Select from '@mui/material/Select'
import Avatar from '@mui/material/Avatar'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import ArrowRightIcon from '@mui/icons-material/ArrowRight'

import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation } from 'swiper'
import 'swiper/css'
import 'swiper/css/navigation'

import Adam from '../images/login/Adam_login.png'
import Ash from '../images/login/Ash_login.png'
import Lucy from '../images/login/Lucy_login.png'
import Nancy from '../images/login/Nancy_login.png'
import { useAppSelector, useAppDispatch } from '../hooks'
import {
  setAudioInputDeviceId,
  setAudioOutputDeviceId,
  setLoggedIn,
  setVideoDeviceId,
} from '../stores/UserStore'
import { getAvatarString, getColorByString } from '../util'

import phaserGame from '../PhaserGame'
import Game from '../scenes/Game'
import { FormControl, FormHelperText, InputLabel, MenuItem } from '@mui/material'

const Wrapper = styled.form`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #222639;
  border-radius: 16px;
  padding: 36px 60px;
  box-shadow: 0px 0px 10px #0000006f;
`

const Title = styled.p`
  margin: 5px;
  font-size: 20px;
  color: #c2c2c2;
  text-align: center;
`

const RoomName = styled.div`
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
  margin-right: 100px;

  --swiper-navigation-size: 24px;

  .swiper {
    width: 180px;
    height: 220px;
    border-radius: 16px;
    overflow: hidden;
  }

  .swiper-slide {
    width: 160px;
    height: 220px;
    background: #dbdbe0;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .swiper-slide img {
    display: block;
    width: 95px;
    height: 136px;
    object-fit: contain;
  }
`

const Right = styled.div`
  width: 350px;
`

const Bottom = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`

const Block = styled.div`
  margin-top: 30px;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 3px;
`

const SmallBlock = styled.div`
  margin-top: 10px;
  position: relative;
`

const avatars = [
  { name: 'adam', img: Adam },
  { name: 'ash', img: Ash },
  { name: 'lucy', img: Lucy },
  { name: 'nancy', img: Nancy },
]

// shuffle the avatars array
for (let i = avatars.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1))
  ;[avatars[i], avatars[j]] = [avatars[j], avatars[i]]
}

export default function LoginDialog() {
  const [name, setName] = useState<string>('')
  const [avatarIndex, setAvatarIndex] = useState<number>(0)
  const [nameFieldEmpty, setNameFieldEmpty] = useState<boolean>(false)
  const [videoInputFieldEmpty, setVideoInputFieldEmpty] = useState<boolean>(false)
  const [audioInputFieldEmpty, setAudioInputFieldEmpty] = useState<boolean>(false)
  const [audioOutputFieldEmpty, setAudioOutputFieldEmpty] = useState<boolean>(false)
  const dispatch = useAppDispatch()
  const devices = useAppSelector((state) => state.user.devices)
  const microphonePermissionGranted = useAppSelector(
    (state) => state.user.microphonePermissionGranted
  )
  const cameraPermissionGranted = useAppSelector((state) => state.user.cameraPermissionGranted)
  const videoDeviceId = useAppSelector((state) => state.user.videoDeviceId)
  const audioInputDeviceId = useAppSelector((state) => state.user.audioInputDeviceId)
  const audioOutputDeviceId = useAppSelector((state) => state.user.audioOutputDeviceId)
  const roomJoined = useAppSelector((state) => state.room.roomJoined)
  const roomName = useAppSelector((state) => state.room.roomName)
  const roomDescription = useAppSelector((state) => state.room.roomDescription)
  const game = phaserGame.scene.keys.game as Game

  const devicePermissionsGranted = microphonePermissionGranted && cameraPermissionGranted

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (
      name === '' ||
      videoDeviceId === '' ||
      audioInputDeviceId === '' ||
      audioOutputDeviceId === ''
    ) {
      if (name === '') {
        setNameFieldEmpty(true)
      }
      if (videoDeviceId === '') {
        setVideoInputFieldEmpty(true)
      }
      if (audioInputDeviceId === '') {
        setAudioInputFieldEmpty(true)
      }
      if (audioOutputDeviceId === '') {
        setAudioOutputFieldEmpty(true)
      }
    } else if (roomJoined) {
      game.network.webRTC?.setUpButtons()
      console.log('Join! Name:', name, 'Avatar:', avatars[avatarIndex].name)
      game.registerKeys()
      game.myPlayer.setPlayerName(name)
      game.myPlayer.setPlayerTexture(avatars[avatarIndex].name)
      game.network.readyToConnect()
      dispatch(setLoggedIn(true))
    }
  }

  return (
    <>
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
            <SubTitle>Select an avatar</SubTitle>
            <Swiper
              modules={[Navigation]}
              navigation
              spaceBetween={0}
              slidesPerView={1}
              onSlideChange={(swiper) => {
                setAvatarIndex(swiper.activeIndex)
              }}
            >
              {avatars.map((avatar) => (
                <SwiperSlide key={avatar.name}>
                  <img src={avatar.img} alt={avatar.name} />
                </SwiperSlide>
              ))}
            </Swiper>
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
            {!devicePermissionsGranted && (
              <Block>
                <Alert variant="outlined" severity="warning">
                  <AlertTitle>Warning</AlertTitle>
                  No webcam/mic connected - <strong>please connect one for best experience!</strong>
                </Alert>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() => {
                    game.network.webRTC?.getInitialPermission()
                  }}
                >
                  Connect Webcam
                </Button>
              </Block>
            )}

            {devicePermissionsGranted && (
              <Block>
                <FormControl fullWidth error={videoInputFieldEmpty}>
                  <InputLabel id="login-dialog-video-input-label">Video Input</InputLabel>
                  <Select
                    labelId="login-dialog-video-input-label"
                    label="Video Input"
                    color="secondary"
                    value={videoDeviceId}
                    onChange={(e) => {
                      dispatch(setVideoDeviceId(e.target.value))
                      game.network.webRTC?.getUserMedia()
                    }}
                  >
                    {devices
                      .filter((d) => d.kind === 'videoinput')
                      .map((d) => (
                        <MenuItem key={d.id} value={d.id}>
                          {d.label}
                        </MenuItem>
                      ))}
                  </Select>
                  {videoInputFieldEmpty && (
                    <FormHelperText>Selected video input device is required.</FormHelperText>
                  )}
                </FormControl>
                <SmallBlock />
                <FormControl fullWidth error={audioInputFieldEmpty}>
                  <InputLabel id="login-dialog-audio-input-label">Audio Input</InputLabel>
                  <Select
                    labelId="login-dialog-audio-input-label"
                    label="Audio Input"
                    color="secondary"
                    value={audioInputDeviceId}
                    onChange={(e) => {
                      dispatch(setAudioInputDeviceId(e.target.value))
                      game.network.webRTC?.getUserMedia()
                    }}
                  >
                    {devices
                      .filter((d) => d.kind === 'audioinput')
                      .map((d) => (
                        <MenuItem key={d.id} value={d.id}>
                          {d.label}
                        </MenuItem>
                      ))}
                  </Select>
                  {audioInputFieldEmpty && (
                    <FormHelperText>Selected audio input device is required.</FormHelperText>
                  )}
                </FormControl>
                <SmallBlock />
                <FormControl fullWidth error={audioOutputFieldEmpty}>
                  <InputLabel id="login-dialog-audio-output-label">Audio Output</InputLabel>
                  <Select
                    labelId="login-dialog-audio-output-label"
                    label="Audio Output"
                    color="secondary"
                    value={audioOutputDeviceId}
                    onChange={(e) => {
                      dispatch(setAudioOutputDeviceId(e.target.value))
                      game.network.webRTC?.getUserMedia()
                    }}
                  >
                    {devices
                      .filter((d) => d.kind === 'audiooutput')
                      .map((d) => (
                        <MenuItem key={d.id} value={d.id}>
                          {d.label}
                        </MenuItem>
                      ))}
                  </Select>
                  {audioOutputFieldEmpty && (
                    <FormHelperText>Selected audio output device is required.</FormHelperText>
                  )}
                </FormControl>
              </Block>
            )}
          </Right>
        </Content>
        <Bottom>
          <Button variant="contained" color="secondary" size="large" type="submit">
            Join
          </Button>
        </Bottom>
      </Wrapper>
    </>
  )
}
