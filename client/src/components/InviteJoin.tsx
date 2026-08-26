import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import LinearProgress from '@mui/material/LinearProgress'

import { useAppSelector } from '../hooks'
import { forgetShareLink } from '../shareLink'
import phaserGame from '../PhaserGame'
import Bootstrap from '../scenes/Bootstrap'

const Wrapper = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 360px;
  align-items: stretch;

  h3 {
    color: #eee;
    font-size: 20px;
    text-align: center;
    margin: 0;
  }

  p {
    color: #c2c2c2;
    font-size: 15px;
    text-align: center;
    margin: 0;
  }
`

type Stage = 'joining' | 'password' | 'failed'

/**
 * Shown when someone opens a share link. It tries the room straight away, and
 * only asks for a password if the room turns out to have one.
 */
export function InviteJoin({
  invite,
  onGiveUp,
}: {
  invite: { kind: 'office' | 'room'; id: string }
  onGiveUp: () => void
}) {
  const [stage, setStage] = useState<Stage>('joining')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const lobbyJoined = useAppSelector((state) => state.room.lobbyJoined)

  const attempt = (withPassword: string | null) => {
    setStage('joining')
    const bootstrap = phaserGame.scene.keys.bootstrap as Bootstrap

    const opening =
      invite.kind === 'office'
        ? bootstrap.network.joinOfficeBySlug(invite.id, withPassword)
        : bootstrap.network.joinCustomById(invite.id, withPassword)

    opening
      .then(() => {
        forgetShareLink()
        bootstrap.launchGame()
      })
      .catch((error) => {
        console.error(error)
        if (error?.code === 403) {
          setStage('password')
          setMessage(withPassword ? 'That password is not right.' : '')
          return
        }
        if (error?.code === 429) {
          setStage('failed')
          setMessage('Too many attempts. Wait a minute and try the link again.')
          return
        }
        setStage('failed')
        setMessage(
          invite.kind === 'office'
            ? 'That office has expired, or the link is wrong.'
            : 'That office is no longer open, or the link is wrong.'
        )
      })
  }

  // the lobby has to be connected before the room can be looked up
  useEffect(() => {
    if (lobbyJoined) attempt(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lobbyJoined])

  const submitPassword = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (password) attempt(password)
  }

  if (stage === 'joining') {
    return (
      <Wrapper as="div">
        <h3>Joining office</h3>
        <p>{invite.id}</p>
        <LinearProgress color="secondary" />
      </Wrapper>
    )
  }

  if (stage === 'password') {
    return (
      <Wrapper onSubmit={submitPassword}>
        <h3>This office is private</h3>
        <p>Enter the password to join this office</p>
        <TextField
          autoFocus
          fullWidth
          label="Password"
          type="password"
          variant="outlined"
          color="secondary"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        {message && (
          <Alert severity="error" variant="outlined">
            {message}
          </Alert>
        )}
        <Button variant="contained" color="secondary" type="submit">
          Join
        </Button>
        <Button color="secondary" onClick={onGiveUp}>
          Browse rooms instead
        </Button>
      </Wrapper>
    )
  }

  return (
    <Wrapper as="div">
      <h3>Could not open that link</h3>
      <Alert severity="error" variant="outlined">
        {message}
      </Alert>
      <Button variant="contained" color="secondary" onClick={onGiveUp}>
        Browse rooms instead
      </Button>
    </Wrapper>
  )
}
