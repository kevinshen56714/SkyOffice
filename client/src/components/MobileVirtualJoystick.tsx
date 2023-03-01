import { useEffect } from 'react'
import styled from 'styled-components'
import JoystickItem from './Joystick'

import phaserGame from '../PhaserGame'
import Game from '../scenes/Game'

import { useAppSelector } from '../hooks'
import { JoystickMovement } from './Joystick'
import { isSmallScreenWidth } from '../utils'
import { Fab } from '@mui/material'
import { phaserEvents, Event } from '../events/EventCenter'

const enum JoystickActiveKeys {
  E = 'E',
  R = 'R',
}

const Backdrop = styled.div`
  position: fixed;
  bottom: 100px;
  right: 32px;
  max-height: 50%;
  max-width: 100%;
  z-index: 99999;
`

const Wrapper = styled.div`
  position: relative;
  height: 100%;
  padding: 16px;
  display: flex;
  flex-direction: column;
`

const JoystickWrapper = styled.div`
  margin-top: auto;
  align-self: center;
`

// Buttons //

const ButtonsWrapper = styled.div`
  display: flex;
  flex-direction: row;
  gap: 25px;
  margin-bottom: 24px;
`

const StyledFab = styled(Fab)<{ target?: string }>`
  &:active {
    color: #1ea2df;
  }
`

export default function MobileVirtualJoystick() {
  const showJoystick = useAppSelector((state) => state.joystick.showJoystick)
  const showChat = useAppSelector((state) => state.chat.showChat)
  const showButtonE = useAppSelector((state) => state.joystick.showButtonE)
  const showButtonR = useAppSelector((state) => state.joystick.showButtonR)
  const hasSmallScreen = isSmallScreenWidth(650)
  const game = phaserGame.scene.keys.game as Game

  useEffect(() => {}, [showJoystick, showChat])

  const handleMovement = (movement: JoystickMovement) => {
    game.myPlayer?.handleJoystickMovement(movement)
  }

  const handleKeyPressed = (keyPressed: JoystickActiveKeys) => {
    phaserEvents.emit(Event.JOYSTICK_KEY_DOWN, keyPressed)
  }

  return (
    <Backdrop>
      {!(showChat && hasSmallScreen) && showJoystick && (
        <Wrapper>
          <ButtonsWrapper>
            {showButtonE && (
              <StyledFab
                color="secondary"
                size="medium"
                onClick={() => handleKeyPressed(JoystickActiveKeys.E)}
              >
                E
              </StyledFab>
            )}
            {showButtonR && (
              <StyledFab
                color="secondary"
                size="medium"
                onClick={() => handleKeyPressed(JoystickActiveKeys.R)}
              >
                R
              </StyledFab>
            )}
          </ButtonsWrapper>
          <JoystickWrapper>
            <JoystickItem onDirectionChange={handleMovement}></JoystickItem>
          </JoystickWrapper>
        </Wrapper>
      )}
    </Backdrop>
  )
}
