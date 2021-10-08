import React, { useState, VideoHTMLAttributes, useEffect, useRef } from 'react'
import styled from 'styled-components'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import CloseIcon from '@mui/icons-material/Close'

import { useAppSelector, useAppDispatch } from '../hooks'
import { closeComputerDialog } from '../stores/ComputerStore'

import phaserGame from '../PhaserGame'
import Game from '../scenes/Game'

const Backdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  padding: 16px 180px 16px 16px;
`
const Wrapper = styled.div`
  width: 100%;
  height: 100%;
  background: #222639;
  border-radius: 16px;
  padding: 16px;
  color: #eee;
  position: relative;

  .close {
    position: absolute;
    top: 16px;
    right: 16px;
  }
`

const VideoGrid = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;

  video {
    flex: 1;
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
`

export default function ComputerDialog() {
  const refVideo = useRef<HTMLVideoElement>(null)

  const dispatch = useAppDispatch()
  const shareScreenManager = useAppSelector((state) => state.computer.shareScreenManager)
  const myStream = useAppSelector((state) => state.computer.myStream)

  useEffect(() => {
    if (!refVideo.current || !myStream) return
    refVideo.current.srcObject = myStream
  }, [myStream])

  return (
    <Backdrop>
      <Wrapper>
        <IconButton
          aria-label="close dialog"
          className="close"
          onClick={() => dispatch(closeComputerDialog())}
        >
          <CloseIcon />
        </IconButton>

        <Button
          variant="contained"
          color="secondary"
          onClick={() => {
            shareScreenManager?.startScreenShare()
          }}
        >
          Share Screen
        </Button>

        <VideoGrid>{myStream && <video ref={refVideo} autoPlay></video>}</VideoGrid>
      </Wrapper>
    </Backdrop>
  )
}
