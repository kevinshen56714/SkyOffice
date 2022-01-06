import React, { useState } from 'react'
import styled from 'styled-components'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'

import network from '../services/Network'

const Backdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
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
  const [connectionWarning, setConnectionWarning] = useState(true)
  return (
    <Backdrop>
      <Wrapper>
        {connectionWarning && (
          <Alert
            severity="warning"
            onClose={() => {
              setConnectionWarning(!connectionWarning)
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
          onClick={() => network.webRTC?.getUserMedia()}
        >
          Connect Webcam
        </Button>
      </Wrapper>
    </Backdrop>
  )
}
