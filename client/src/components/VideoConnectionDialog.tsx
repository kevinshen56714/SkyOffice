import React from 'react'
import styled from 'styled-components'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'

import phaserGame from '../PhaserGame'
import Game from '../scenes/Game'

import { useAppSelector, useAppDispatch } from '../hooks'
import { closeVideoConnectionWarning } from '../stores/UserStore'

const Backdrop = styled.div`
  position: fixed;
  top: 0;
`

const Wrapper = styled.div`
  width: 100%;
  height: 100%;
  padding: 16px;
  position: relative;
  display: flex;
  flex-direction: column;
`

export default function VideoConnectionDialog() {
  const dispatch = useAppDispatch()
  const videoConnectionWarning = useAppSelector((state) => state.user.videoConnectionWarning)
  return (
    <Backdrop>
      <Wrapper>
        {videoConnectionWarning && (
          <Alert
            severity="warning"
            onClose={() => {
              dispatch(closeVideoConnectionWarning())
            }}
          >
            <AlertTitle>Warning</AlertTitle>
            No webcam connected
            <br /> <strong>connect one for full experience!</strong>
          </Alert>
        )}
        <Button
          variant="contained"
          color="secondary"
          onClick={() => {
            const game = phaserGame.scene.keys.game as Game
            game.network.webRTC?.getUserMedia()
          }}
        >
          Connect Webcam
        </Button>
      </Wrapper>
    </Backdrop>
  )
}
