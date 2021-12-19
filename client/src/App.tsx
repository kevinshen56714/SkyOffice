import React from 'react'
import styled from 'styled-components'

import { useAppSelector } from './hooks'

import RoomSelectionDialog from './components/RoomSelectionDialog'
import LoginDialog from './components/LoginDialog'
import ComputerDialog from './components/ComputerDialog'
import VideoConnectionDialog from './components/VideoConnectionDialog'
import Chat from './components/Chat'

const Backdrop = styled.div`
  position: absolute;
  height: 100%;
  width: 100%;
`

function App() {
  const loggedIn = useAppSelector((state) => state.user.loggedIn)
  const computerDialogOpen = useAppSelector((state) => state.computer.computerDialogOpen)
  const videoConnected = useAppSelector((state) => state.user.videoConnected)
  const roomSelected = useAppSelector((state) => state.user.roomSelected)

  return (
    <Backdrop>
      {/* Render the LoginDialog if not logged in, else render Chat. */}
      {loggedIn ? (
        <>
          <Chat />

          {/* Render the ComputerDialog if user is using a computer. */}
          {computerDialogOpen && <ComputerDialog />}

          {/* Render the VideoConnectionDialog if user is not connected to a webcam. */}
          {!computerDialogOpen && !videoConnected && <VideoConnectionDialog />}
        </>
      ) : roomSelected ? (
        <LoginDialog />
      ) : (
        <RoomSelectionDialog />
      )}
    </Backdrop>
  )
}

export default App
