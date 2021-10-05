import React from 'react'

import { useAppSelector } from './hooks'

import LoginDialog from './components/LoginDialog'
// import Debug from './components/Debug'

function App() {
  const loggedIn = useAppSelector((state) => state.user.loggedIn)

  return (
    <div className="App">
      {/* <Debug /> */}

      {/* Render the LoginDialog if not logged in yet. */}
      {!loggedIn && <LoginDialog />}
    </div>
  )
}

export default App
