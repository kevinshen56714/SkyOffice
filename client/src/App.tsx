import React from 'react'

import { useAppSelector } from './hooks'

import LoginDialog from './components/LoginDialog'
import ComputerDialog from './components/ComputerDialog'
// import Debug from './components/Debug'

function App() {
  const loggedIn = useAppSelector((state) => state.user.loggedIn)
  const computerDialogOpen = useAppSelector((state) => state.computer.computerDialogOpen)

  return (
    <div className="App">
      {/* <Debug /> */}

      {/* Render the LoginDialog if not logged in yet. */}
      {!loggedIn && <LoginDialog />}

      {/* Render the ComputerDialog if user is using a computer. */}
      {computerDialogOpen && <ComputerDialog />}
    </div>
  )
}

export default App
