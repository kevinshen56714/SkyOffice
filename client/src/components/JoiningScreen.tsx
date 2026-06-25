import React, { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'

import phaserGame from '../PhaserGame'
import Bootstrap from '../scenes/Bootstrap'
import { hasCredentials } from '../services/Api'

// Phaser registers scenes on the tick after `new Phaser.Game(...)`, so `scene.keys.bootstrap` can be
// undefined when this component first mounts. Poll briefly until the scene exists.
function waitForBootstrap(timeoutMs = 10000): Promise<Bootstrap> {
  return new Promise((resolve, reject) => {
    const started = performance.now()
    const tick = () => {
      const scene = phaserGame.scene.keys.bootstrap as Bootstrap | undefined
      if (scene) resolve(scene)
      else if (performance.now() - started > timeoutMs) reject(new Error('bootstrap scene not ready'))
      else requestAnimationFrame(tick)
    }
    tick()
  })
}

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
  // Launch exactly once. The ref survives React StrictMode's double-invoked effect (same fiber), so
  // we never join the Colyseus room twice.
  const launchedRef = useRef(false)

  useEffect(() => {
    if (launchedRef.current) return
    if (!hasCredentials()) {
      setError('Missing access token or workspace. Open this office from the Virtual Office app.')
      return
    }
    launchedRef.current = true
    waitForBootstrap()
      .then((bootstrap) => bootstrap.launchWorkspace())
      .catch((err: any) => {
        const status = err?.code ?? err?.status
        if (status === 401) setError('Your session has expired — please sign in again.')
        else if (status === 403) setError('You are not a member of this workspace.')
        else setError('Could not enter the workspace. Please try again.')
        console.error('failed to join workspace', err)
      })
  }, [])

  return <Backdrop>{error ?? 'Joining your workspace…'}</Backdrop>
}
