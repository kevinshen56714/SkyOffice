import React from 'react'
import styled from 'styled-components'

import { useAppSelector } from './hooks'

import RoomSelectionDialog from './components/RoomSelectionDialog'
import LoginDialog from './components/LoginDialog'
import ComputerDialog from './components/ComputerDialog'
import WhiteboardDialog from './components/WhiteboardDialog'
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
  const whiteboardDialogOpen = useAppSelector((state) => state.whiteboard.whiteboardDialogOpen)
  const videoConnected = useAppSelector((state) => state.user.videoConnected)
  const roomJoined = useAppSelector((state) => state.room.roomJoined)
  const anyDialogOpened = computerDialogOpen || whiteboardDialogOpen

  return (
    <Backdrop>
      {loggedIn ? (
        anyDialogOpened ? (
          <>
            {/* Render ComputerDialog if user is using a computer. */}
            {computerDialogOpen && <ComputerDialog />}
            {/* Render WhiteboardDialog if user is using a whiteboard. */}
            {whiteboardDialogOpen && <WhiteboardDialog />}
          </>
        ) : (
          /* Render Chat or VideoConnectionDialog if no dialogs are opened. */
          <>
            <Chat />
            {/* Render VideoConnectionDialog if user is not connected to a webcam. */}
            {!videoConnected && <VideoConnectionDialog />}
          </>
        )
      ) : roomJoined ? (
        /* Render LoginDialog if not logged in. */
        <LoginDialog />
      ) : (
        /* Render RoomSelectionDialog if yet selected a room. */
        <RoomSelectionDialog />
      )}
      {/* Render HelperButtonGroup if no dialogs are opened. */}
      {!anyDialogOpened && <HelperButtonGroup />}
    </Backdrop>
  )
}

export default App
