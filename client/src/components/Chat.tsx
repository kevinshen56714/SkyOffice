import React, { useRef } from 'react'
import styled from 'styled-components'
import Box from '@mui/material/Box'
import Fab from '@mui/material/Fab'
import List from '@mui/material/List'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import InputBase from '@mui/material/InputBase'
import InsertEmoticonIcon from '@mui/icons-material/InsertEmoticon'
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline'
import CloseIcon from '@mui/icons-material/Close'
import 'emoji-mart/css/emoji-mart.css'
import { Picker } from 'emoji-mart'

const Backdrop = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  height: 420px;
  width: 560px;
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
  /* background: linear-gradient(0deg, #000000a7, #2424249e); */
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
  /* border: 1px solid #5e696b; */
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

const o = new Intl.DateTimeFormat('en', {
  timeStyle: 'short',
  dateStyle: 'short',
})

function refreshMessages(): MessageExample[] {
  const getRandomInt = (max: number) => Math.floor(Math.random() * Math.floor(max))

  return Array.from(new Array(50)).map(() => messageExamples[getRandomInt(messageExamples.length)])
}

export default function Chat() {
  const [value, setValue] = React.useState('')
  const [showChat, setShowChat] = React.useState(true)
  const [showEmojiPicker, setShowEmojiPicker] = React.useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const [messages, setMessages] = React.useState(() => refreshMessages())

  React.useEffect(() => {
    ;(ref.current as HTMLDivElement).ownerDocument.body.scrollTop = 0
    setMessages(refreshMessages())
  }, [value, setMessages])
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
              <ChatBox ref={ref}>
                <List>
                  {messages.map(({ primary, secondary, person }, index) => (
                    <>
                      <Divider
                        style={{
                          color: '#d1cfcf',
                          margin: '7px',
                          textShadow: '0.3px 0.3px black',
                          fontSize: 14,
                        }}
                      >
                        {o.format(Date.now())}
                      </Divider>
                      <p
                        style={{
                          // color: '#7bffe7',
                          color: colorArr[Math.floor(Math.random() * colorArr.length)],
                          margin: '7px',
                          textShadow: '0.3px 0.3px black',
                          fontSize: 15,
                          fontWeight: 'bold',
                          lineHeight: 1.4,
                        }}
                      >
                        Kevin{' '}
                        <span style={{ color: 'white', fontWeight: 'normal' }}>{secondary}</span>{' '}
                      </p>
                      {/* <ListItem key={index + person}>
                    <ListItemText primary={value} secondary={secondary} />
                  </ListItem> */}
                    </>
                  ))}

                  <p
                    style={{
                      color: '#ffe346',
                      fontWeight: 'bold',
                      margin: '7px',
                      lineHeight: 1.3,
                      fontSize: 15,
                    }}
                  >
                    Dax Joined the room!
                  </p>
                </List>
                {showEmojiPicker && (
                  <Picker
                    theme="dark"
                    showSkinTones={false}
                    showPreview={false}
                    style={{ position: 'absolute', bottom: '58px', right: '16px' }}
                    onSelect={(emoji) => {
                      setValue('hihi ' + emoji.native)
                      setShowEmojiPicker(!showEmojiPicker)
                    }}
                    exclude={['recent', 'flags']}
                  />
                )}
              </ChatBox>
              <InputWrapper>
                <InputTextField autoFocus fullWidth placeholder="Aa" />
                <IconButton aria-label="emoji">
                  <InsertEmoticonIcon
                    onClick={() => {
                      setShowEmojiPicker(!showEmojiPicker)
                    }}
                  />
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
interface MessageExample {
  primary: string
  secondary: string
  person: string
}

const messageExamples: readonly MessageExample[] = [
  {
    primary: 'Brunch this week?',
    secondary: "I'll be in the neighbourhood this week. Let's grab a bite to eat",
    person: '/static/images/avatar/5.jpg',
  },
  {
    primary: 'Birthday Gift',
    secondary: `Do you have a suggestion for a good present for John on his work
      anniversary. I am really confused & would love your thoughts on it.`,
    person: '/static/images/avatar/1.jpg',
  },
  {
    primary: 'Recipe to try',
    secondary: 'I am try out this new BBQ recipe, I think this might be amazing',
    person: '/static/images/avatar/2.jpg',
  },
  {
    primary: 'Yes!',
    secondary: 'I have the tickets to the ReactConf for this year.',
    person: '/static/images/avatar/3.jpg',
  },
  {
    primary: "Doctor's Appointment",
    secondary: 'My appointment for the doctor was rescheduled for next Saturday.',
    person: '/static/images/avatar/4.jpg',
  },
  {
    primary: 'Discussion',
    secondary: `Menus that are generated by the bottom app bar (such as a bottom
      navigation drawer or overflow menu) open as bottom sheets at a higher elevation
      than the bar.`,
    person: '/static/images/avatar/5.jpg',
  },
  {
    primary: 'Summer BBQ',
    secondary: `Who wants to have a cookout this weekend? I just got some furniture
      for my backyard and would love to fire up the grill.`,
    person: '/static/images/avatar/1.jpg',
  },
]
