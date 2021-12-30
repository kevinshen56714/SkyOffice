import React from 'react'
import styled from 'styled-components'
import IconButton from '@mui/material/IconButton'
import CloseIcon from '@mui/icons-material/Close'

import { useAppSelector, useAppDispatch } from '../hooks'
import { closeWhiteboardDialog } from '../stores/WhiteboardStore'

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
  display: flex;
  flex-direction: column;

  .close {
    position: absolute;
    top: 16px;
    right: 16px;
  }
`

const WhiteboardWrapper = styled.div`
  flex: 1;
  border-radius: 25px;
  overflow: hidden;
  margin-right: 50px;
  iframe {
    width: 100%;
    height: 100%;
  }
`

export default function WhiteboardDialog() {
  const whiteboardUrl = useAppSelector((state) => state.whiteboard.whiteboardUrl)
  const dispatch = useAppDispatch()

  return (
    <Backdrop>
      <Wrapper>
        <IconButton
          aria-label="close dialog"
          className="close"
          onClick={() => dispatch(closeWhiteboardDialog())}
        >
          <CloseIcon />
        </IconButton>
        {whiteboardUrl && (
          <WhiteboardWrapper>
            <iframe title="white board" src={whiteboardUrl} />
          </WhiteboardWrapper>
        )}
      </Wrapper>
    </Backdrop>
  )
}
