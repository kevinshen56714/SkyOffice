import React, { useEffect, useState } from 'react'
import styled from 'styled-components'

import phaserGame from '../PhaserGame'
import Bootstrap from '../scenes/Bootstrap'
import { hasCredentials } from '../services/Api'

const Backdrop = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #eee;
  font-size: 18px;
  text-align: center;
  padding: 24px;
`

/**
 * Entry flow for the forked client (INTEGRATION.md §1, §3): instead of the room picker + login
 * dialog, the user is dropped straight into their workspace using the JWT + workspaceId from the
 * URL. Identity (name, avatar, spawn) comes from their desk, so there is nothing to type.
 */
export default function JoiningScreen() {
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!hasCredentials()) {
      setError('Missing access token or workspace. Open this office from the Virtual Office app.')
      return
    }
    const bootstrap = phaserGame.scene.keys.bootstrap as Bootstrap
    bootstrap.launchWorkspace().catch((err: any) => {
      const status = err?.code ?? err?.status
      if (status === 401) setError('Your session has expired — please sign in again.')
      else if (status === 403) setError('You are not a member of this workspace.')
      else setError('Could not enter the workspace. Please try again.')
      console.error('failed to join workspace', err)
    })
  }, [])

  return <Backdrop>{error ?? 'Joining your workspace…'}</Backdrop>
}
