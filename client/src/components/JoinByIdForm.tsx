import React, { useState } from 'react'
import styled from 'styled-components'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Alert from '@mui/material/Alert'

import { useAppSelector } from '../hooks'
import phaserGame from '../PhaserGame'
import Bootstrap from '../scenes/Bootstrap'

const Wrapper = styled.form`
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;

  .fields {
    display: flex;
    gap: 10px;
    align-items: flex-start;
  }

  .hint {
    font-size: 14px;
    color: #c2c2c2;
    margin: 0;
  }
`

/**
 * Unlisted rooms never show up in the table, so this is the only way into one.
 */
export const JoinByIdForm = () => {
  const [roomId, setRoomId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const lobbyJoined = useAppSelector((state) => state.room.lobbyJoined)

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const id = roomId.trim()
    if (!id || !lobbyJoined) return

    setError('')
    const bootstrap = phaserGame.scene.keys.bootstrap as Bootstrap
    bootstrap.network
      .joinCustomById(id, password || null)
      .then(() => bootstrap.launchGame())
      .catch((joinError) => {
        console.error(joinError)
        setError(
          joinError?.code === 403
            ? 'Incorrect password for that room.'
            : 'No room with that ID, or it is no longer running.'
        )
      })
  }

  return (
    <Wrapper onSubmit={handleSubmit}>
      <p className="hint">Have a room ID? Unlisted rooms can only be joined this way.</p>
      <div className="fields">
        <TextField
          size="small"
          label="Room ID"
          variant="outlined"
          color="secondary"
          value={roomId}
          onChange={(event) => setRoomId(event.target.value)}
        />
        <TextField
          size="small"
          label="Password (if any)"
          type="password"
          variant="outlined"
          color="secondary"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <Button variant="outlined" color="secondary" type="submit">
          Join
        </Button>
      </div>
      {error && (
        <Alert severity="error" variant="outlined">
          {error}
        </Alert>
      )}
    </Wrapper>
  )
}
