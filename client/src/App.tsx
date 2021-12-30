import React from 'react'
import styled from 'styled-components'

import { useAppSelector } from './hooks'

import RoomSelectionDialog from './components/RoomSelectionDialog'
import LoginDialog from './components/LoginDialog'
import ComputerDialog from './components/ComputerDialog'
import VideoConnectionDialog from './components/VideoConnectionDialog'
import Chat from './components/Chat'
import HelperButtonGroup from './components/HelperButtonGroup'

const Backdrop = styled.div`
  position: absolute;
  height: 100%;
  width: 100%;
`

function App() {
  const loggedIn = useAppSelector((state) => state.user.loggedIn)
  const computerDialogOpen = useAppSelector((state) => state.computer.computerDialogOpen)
  const videoConnected = useAppSelector((state) => state.user.videoConnected)
  const roomJoined = useAppSelector((state) => state.room.roomJoined)

  return (
    <Backdrop>
      {/* Render the LoginDialog if not logged in, else render Chat. */}
      {loggedIn ? (
        /* Render the ComputerDialog if user is using a computer. */
        computerDialogOpen ? (
          <ComputerDialog />
        ) : (
          <>
            <Chat />
            {/* Render the VideoConnectionDialog if user is not connected to a webcam. */}
            {!videoConnected && <VideoConnectionDialog />}
          </>
        )
      ) : roomJoined ? (
        <LoginDialog />
      ) : (
        <RoomSelectionDialog />
      )}
      {!computerDialogOpen && <HelperButtonGroup />}
    </Backdrop>
  )
}

export default App
