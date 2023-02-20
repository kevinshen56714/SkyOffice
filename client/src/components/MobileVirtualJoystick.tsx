import React, { useRef, useState, useEffect } from 'react'
import styled from 'styled-components'
import 'emoji-mart/css/emoji-mart.css'
import JoystickItem from './Joystick'

import phaserGame from '../PhaserGame'
import Game from '../scenes/Game'

import { useAppDispatch, useAppSelector } from '../hooks'

export interface JoystickMovement {
  isMoving: boolean
  direction: {
    left: boolean
    right: boolean
    up: boolean
    down: boolean
  }
}

const Backdrop = styled.div`
  position: fixed;
  bottom: 100px;
  right: 32px;
  max-height: 50%;
  max-width: 100%;
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
  align-self: flex-end;
`

export default function MobileVirtualJoystick() {
  const inputRef = useRef<HTMLInputElement>(null)

  const showJoystick = useAppSelector((state) => state.user.showJoystick)
  const focused = useAppSelector((state) => state.chat.focused)
  const showChat = useAppSelector((state) => state.chat.showChat)
  const game = phaserGame.scene.keys.game as Game

  useEffect(() => {
    if (focused) {
      inputRef.current?.focus()
    }
  }, [focused])

  useEffect(() => {}, [showJoystick, showChat])

  const handleMovement = (movement: JoystickMovement) => {
    game.myPlayer?.handleJoystickMovement(movement)
  }

  return (
    <Backdrop>
      <Wrapper>
        {(!showChat || window.innerWidth > 650) && showJoystick && (
          <JoystickWrapper>
            <JoystickItem onDirectionChange={handleMovement}></JoystickItem>
          </JoystickWrapper>
        )}
      </Wrapper>
    </Backdrop>
  )
}
