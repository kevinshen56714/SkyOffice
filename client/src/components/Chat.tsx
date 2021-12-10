import React, { useRef, useState, useEffect } from 'react'
import styled from 'styled-components'
import Box from '@mui/material/Box'
import Fab from '@mui/material/Fab'
import Tooltip from '@mui/material/Tooltip'
import IconButton from '@mui/material/IconButton'
import InputBase from '@mui/material/InputBase'
import InsertEmoticonIcon from '@mui/icons-material/InsertEmoticon'
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline'
import CloseIcon from '@mui/icons-material/Close'
import 'emoji-mart/css/emoji-mart.css'
import { Picker } from 'emoji-mart'
import { useAppSelector } from '../hooks'

import phaserGame from '../PhaserGame'
import Game from '../scenes/Game'
import { MessageType } from '../stores/ChatStore'

const Backdrop = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  height: 400px;
  width: 500px;
  max-height: 50%;
  max-width: 50%;
`

const Wrapper = styled.div`
  height: 100%;
  padding: 16px;
  position: relative;
  display: flex;
  flex-direction: column;
`

const FabWrapper = styled.div`
  margin-top: auto;
`

const ChatHeader = styled.div`
  height: 35px;
  background: #000000a7;
  border-radius: 10px 10px 0px 0px;

  h3 {
    color: #fff;
    margin: 7px;
    font-size: 17px;
    text-align: center;
  }

  .close {
    position: absolute;
    top: 15px;
    right: 15px;
  }
`

const ChatBox = styled(Box)`
  height: 100%;
  width: 100%;
  overflow: auto;
  background: #000000a7;
  background: #2c2c2c;
  border: 1px solid #00000029;
`

const MessageWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  padding: 0px 4px;

  p {
    margin: 3px;
    text-shadow: 0.3px 0.3px black;
    font-size: 15px;
    font-weight: bold;
    line-height: 1.4;
    overflow-wrap: anywhere;
  }

  :hover {
    background: #3a3a3a;
  }
`

const InputWrapper = styled.div`
  box-shadow: 10px 10px 10px #00000018;
  border: 1px solid #42eacb;
  border-radius: 0px 0px 10px 10px;
  display: flex;
  flex-direction: row;
  background: linear-gradient(180deg, #000000c1, #242424c0);
`

const InputTextField = styled(InputBase)`
  border-radius: 0px 0px 10px 10px;
  input {
    padding: 5px;
    font-size: 15;
  }
`

const colorArr = ['#7bf1a8', '#ff7e50', '#9acd32', '#daa520', '#ff69b4', '#c085f6']

// determine name color by first character charCode
const getColorByName = (author: string) => {
  return colorArr[Math.floor(author.charCodeAt(0) % colorArr.length)]
}

const dateFormatter = new Intl.DateTimeFormat('en', {
  timeStyle: 'short',
  dateStyle: 'short',
})

export default function Chat() {
  const [inputValue, setInputValue] = useState('')
  const [showChat, setShowChat] = useState(true)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatMessages = useAppSelector((state) => state.chat.chatMessages)
  const game = phaserGame.scene.keys.game as Game

  const handleChange = (event: React.FormEvent) => {
    var input: any = event.target
    setInputValue(input.value)
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setInputValue('')
    } else if (event.key === 'Enter') {
      handleSubmit()
    }
  }

  const handleSubmit = () => {
    var val = inputValue.trim()
    if (val) {
      setInputValue('')
      game.network.addChatMessage(val)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const Message = ({ chatMessage, messageType }) => {
    const [tooltipOpen, setTooltipOpen] = useState(false)

    return (
      <MessageWrapper
        onMouseEnter={() => {
          setTooltipOpen(true)
        }}
        onMouseLeave={() => {
          setTooltipOpen(false)
        }}
      >
        <Tooltip
          open={tooltipOpen}
          title={dateFormatter.format(chatMessage.createdAt)}
          placement="right"
          arrow
        >
          {messageType === MessageType.REGULAR_MESSAGE ? (
            <p
              style={{
                color: getColorByName(chatMessage.author),
              }}
            >
              {chatMessage.author}{' '}
              <span style={{ color: 'white', fontWeight: 'normal' }}>{chatMessage.content}</span>
            </p>
          ) : messageType === MessageType.PLAYER_JOINED ? (
            <p style={{ color: '#ffe75d', fontStyle: 'italic' }}>
              {`${chatMessage.author} ${chatMessage.content}`}
            </p>
          ) : (
            <p style={{ color: '#fb2e2e', fontStyle: 'italic' }}>
              {`${chatMessage.author} ${chatMessage.content}`}
            </p>
          )}
        </Tooltip>
      </MessageWrapper>
    )
  }

  useEffect(() => {
    scrollToBottom()
  }, [chatMessages])

  return (
    <>
      <Backdrop>
        <Wrapper>
          {showChat ? (
            <>
              <ChatHeader>
                <h3>Chat</h3>
                <IconButton
                  aria-label="close dialog"
                  className="close"
                  onClick={() => setShowChat(!showChat)}
                  size="small"
                >
                  <CloseIcon />
                </IconButton>
              </ChatHeader>
              <ChatBox>
                {chatMessages.map(({ messageType, chatMessage }, index) => (
                  <Message chatMessage={chatMessage} messageType={messageType} key={index} />
                ))}
                <div ref={messagesEndRef} />
                {showEmojiPicker && (
                  <Picker
                    theme="dark"
                    showSkinTones={false}
                    showPreview={false}
                    style={{ position: 'absolute', bottom: '58px', right: '16px' }}
                    onSelect={(emoji) => {
                      setInputValue(inputValue + emoji.native)
                      setShowEmojiPicker(!showEmojiPicker)
                    }}
                    exclude={['recent', 'flags']}
                  />
                )}
              </ChatBox>
              <InputWrapper>
                <InputTextField
                  onFocus={() => game.disableKeys()}
                  onBlur={() => game.enableKeys()}
                  fullWidth
                  placeholder="Aa"
                  value={inputValue}
                  onKeyDown={(e: React.KeyboardEvent) => {
                    handleKeyDown(e)
                  }}
                  onChange={(e: React.KeyboardEvent) => handleChange(e)}
                />
                <IconButton
                  aria-label="emoji"
                  onClick={() => {
                    setShowEmojiPicker(!showEmojiPicker)
                  }}
                >
                  <InsertEmoticonIcon />
                </IconButton>
              </InputWrapper>
            </>
          ) : (
            <FabWrapper>
              <Fab
                color="secondary"
                aria-label="showChat"
                onClick={() => {
                  setShowChat(!showChat)
                }}
              >
                <ChatBubbleOutlineIcon />
              </Fab>
            </FabWrapper>
          )}
        </Wrapper>
      </Backdrop>
    </>
  )
}
