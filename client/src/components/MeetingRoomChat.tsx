import React, { useState, useEffect, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Button, TextField, Box, Typography, Paper, List, ListItem, ListItemText } from '@mui/material'
import { RootState } from '../stores'
import { IMeetingRoomChatMessage } from '../../../types/IOfficeState'
import { MeetingRoomMessageType, pushMeetingRoomChatMessage, setFocused } from '../stores/ChatStore'
import phaserGame from '../PhaserGame'
import Game from '../scenes/Game'

interface MeetingRoomChatProps {
    meetingRoomId: string | null
    roomName: string
    canSendMessages: boolean
}

const MeetingRoomChat: React.FC<MeetingRoomChatProps> = ({ 
    meetingRoomId, 
    roomName, 
    canSendMessages 
}) => {
    const dispatch = useDispatch()
    const [message, setMessage] = useState('')
    const [isVisible, setIsVisible] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    
    const meetingRoomChatMessages = useSelector((state: RootState) => 
        meetingRoomId ? state.chat.meetingRoomChatMessages[meetingRoomId] || [] : []
    )
    
    const sessionId = useSelector((state: RootState) => state.user.sessionId)
    const playerNameMap = useSelector((state: RootState) => state.user.playerNameMap)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        console.log('💬 [MeetingRoomChat] Messages updated:', {
            roomId: meetingRoomId,
            messageCount: meetingRoomChatMessages.length,
            messages: meetingRoomChatMessages.map(m => `${m.chatMessage.author}: ${m.chatMessage.content}`)
        })
        scrollToBottom()
    }, [meetingRoomChatMessages, meetingRoomId])

    useEffect(() => {
        if (meetingRoomId) {
            console.log('🏠 [MeetingRoomChat] Entering room, making chat visible:', meetingRoomId)
            setIsVisible(true)
            // Request chat history when entering a room
            const game = phaserGame.scene.keys.game as Game
            if (game?.network) {
                console.log('📜 [MeetingRoomChat] Requesting chat history for room:', meetingRoomId)
                // game.network.getMeetingRoomChatHistory(meetingRoomId)
            }
        } else {
            console.log('🚪 [MeetingRoomChat] No room ID, hiding chat')
            setIsVisible(false)
        }
    }, [meetingRoomId])

    const handleSendMessage = () => {
        if (!message.trim() || !meetingRoomId || !canSendMessages) {
            console.log('❌ [MeetingRoomChat] Cannot send message:', {
                hasMessage: !!message.trim(),
                hasMeetingRoomId: !!meetingRoomId,
                canSendMessages
            })
            return
        }

        const game = phaserGame.scene.keys.game as Game
        if (game?.network) {
            const messageContent = message.trim()
            console.log('📤 [MeetingRoomChat] Sending message:', {
                roomId: meetingRoomId,
                roomName: roomName,
                message: messageContent,
                timestamp: new Date().toLocaleTimeString()
            })

            // 実際のプレイヤー名を取得
            const currentPlayerName = sessionId ? playerNameMap[sessionId] : 'Unknown'
            
            // Optimistic Update: 即座にUIに表示
            const optimisticMessage = {
                messageId: `temp_${Date.now()}_${Math.random()}`,
                author: currentPlayerName || 'You',
                content: messageContent,
                meetingRoomId: meetingRoomId,
                createdAt: Date.now()
            } as IMeetingRoomChatMessage

            console.log('🚀 [MeetingRoomChat] Adding optimistic message to local store:', {
                messageId: optimisticMessage.messageId,
                author: optimisticMessage.author,
                content: optimisticMessage.content,
                timestamp: new Date(optimisticMessage.createdAt).toLocaleTimeString()
            })

            // 即座にローカルストアに追加
            dispatch(pushMeetingRoomChatMessage({
                meetingRoomId: meetingRoomId,
                message: optimisticMessage
            }))

            // サーバーに送信
            // game.network.sendMeetingRoomChatMessage(meetingRoomId, messageContent)
            setMessage('')
        }
    }

    const handleKeyPress = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault()
            console.log('⌨️ [MeetingRoomChat] Enter key pressed, sending message')
            handleSendMessage()
        }
    }

    const formatTimestamp = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        })
    }

    const getMessageColor = (messageType: MeetingRoomMessageType) => {
        switch (messageType) {
            case MeetingRoomMessageType.USER_JOINED:
                return '#2e7d32' // Darker Green
            case MeetingRoomMessageType.USER_LEFT:
                return '#d32f2f' // Darker Red
            case MeetingRoomMessageType.PERMISSION_CHANGED:
                return '#f57c00' // Darker Orange
            default:
                return '#1565c0' // Blue for regular messages
        }
    }

    const getMessageBackgroundColor = (messageType: MeetingRoomMessageType) => {
        switch (messageType) {
            case MeetingRoomMessageType.USER_JOINED:
                return '#e8f5e8' // Light Green background
            case MeetingRoomMessageType.USER_LEFT:
                return '#ffebee' // Light Red background
            case MeetingRoomMessageType.PERMISSION_CHANGED:
                return '#fff3e0' // Light Orange background
            default:
                return '#f5f5f5' // Light gray for regular messages
        }
    }

    console.log('🔍 [MeetingRoomChat] Render check:', {
        isVisible,
        meetingRoomId,
        roomName,
        canSendMessages,
        messageCount: meetingRoomChatMessages.length,
        shouldRender: isVisible && meetingRoomId
    })

    if (!isVisible || !meetingRoomId) {
        console.log('❌ [MeetingRoomChat] Not rendering - isVisible:', isVisible, 'meetingRoomId:', meetingRoomId)
        return null
    }

    console.log('✅ [MeetingRoomChat] Rendering chat component')

    return (
        <Paper 
            elevation={3}
            sx={{
                position: 'fixed',
                top: 20,
                right: 20,
                width: 350,
                height: 400,
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(0, 0, 0, 0.1)',
                zIndex: 9999,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            }}
        >
            {/* Header */}
            <Box 
                sx={{ 
                    p: 1.5, 
                    borderBottom: '2px solid #1976d2', 
                    background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                    color: 'white',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}
            >
                <Typography variant="h6" sx={{ fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                    💬 {roomName}
                </Typography>
                <Button 
                    size="small" 
                    onClick={() => setIsVisible(false)}
                    sx={{ 
                        minWidth: 'auto', 
                        padding: '4px 8px',
                        color: 'white',
                        '&:hover': {
                            backgroundColor: 'rgba(255,255,255,0.1)'
                        }
                    }}
                >
                    ✕
                </Button>
            </Box>

            {/* Messages List */}
            <Box 
                sx={{ 
                    flex: 1, 
                    overflow: 'auto', 
                    p: 1,
                    '&::-webkit-scrollbar': {
                        width: '6px',
                    },
                    '&::-webkit-scrollbar-track': {
                        background: '#f1f1f1',
                    },
                    '&::-webkit-scrollbar-thumb': {
                        background: '#c1c1c1',
                        borderRadius: '3px',
                    },
                }}
            >
                <List dense>
                    {meetingRoomChatMessages.map((msgData, index) => {
                        const { messageType, chatMessage } = msgData
                        const isSystemMessage = messageType !== MeetingRoomMessageType.REGULAR_MESSAGE
                        return (
                            <ListItem 
                                key={`${chatMessage.messageId}-${index}`} 
                                sx={{ 
                                    px: 1, 
                                    py: 0.5,
                                    mx: 0.5,
                                    mb: 0.5,
                                    borderRadius: 1,
                                    backgroundColor: getMessageBackgroundColor(messageType),
                                    border: isSystemMessage ? `1px solid ${getMessageColor(messageType)}40` : 'none'
                                }}
                            >
                                <ListItemText
                                    primary={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                            <Typography 
                                                variant="caption" 
                                                sx={{ 
                                                    color: '#666',
                                                    fontSize: '10px',
                                                    minWidth: '45px',
                                                    fontFamily: 'monospace'
                                                }}
                                            >
                                                {formatTimestamp(chatMessage.createdAt)}
                                            </Typography>
                                            <Typography 
                                                variant="body2" 
                                                sx={{ 
                                                    fontWeight: 'bold',
                                                    color: getMessageColor(messageType),
                                                    fontSize: '12px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 0.5
                                                }}
                                            >
                                                {isSystemMessage && (
                                                    <span style={{ fontSize: '10px' }}>
                                                        {messageType === MeetingRoomMessageType.USER_JOINED ? '🟢' : 
                                                         messageType === MeetingRoomMessageType.USER_LEFT ? '🔴' : '🔶'}
                                                    </span>
                                                )}
                                                {chatMessage.author}
                                            </Typography>
                                        </Box>
                                    }
                                    secondary={
                                        <Typography 
                                            variant="body2" 
                                            sx={{ 
                                                color: messageType === MeetingRoomMessageType.REGULAR_MESSAGE 
                                                    ? '#333' 
                                                    : getMessageColor(messageType),
                                                fontSize: '12px',
                                                fontStyle: isSystemMessage ? 'italic' : 'normal',
                                                fontWeight: isSystemMessage ? 500 : 400,
                                                wordBreak: 'break-word',
                                                lineHeight: 1.3
                                            }}
                                        >
                                            {chatMessage.content}
                                        </Typography>
                                    }
                                />
                            </ListItem>
                        )
                    })}
                </List>
                <div ref={messagesEndRef} />
            </Box>

            {/* Input Area */}
            <Box 
                sx={{ 
                    p: 1.5, 
                    borderTop: '2px solid #e3f2fd', 
                    background: 'linear-gradient(180deg, #f8fbff 0%, #e3f2fd 100%)',
                    display: 'flex',
                    gap: 1
                }}
            >
                <TextField
                    fullWidth
                    size="small"
                    placeholder={canSendMessages ? "Type a message..." : "You cannot send messages"}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    onFocus={() => {
                        console.log('🎯 [MeetingRoomChat] TextField focused - disabling game keys')
                        dispatch(setFocused(true))
                    }}
                    onBlur={() => {
                        console.log('🎯 [MeetingRoomChat] TextField blurred - enabling game keys')
                        dispatch(setFocused(false))
                    }}
                    disabled={!canSendMessages}
                    multiline
                    maxRows={3}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            fontSize: '12px',
                            backgroundColor: 'white',
                            color: '#333',
                            '& input': {
                                color: '#333',
                            },
                            '& textarea': {
                                color: '#333',
                            },
                            '& .MuiInputBase-input::placeholder': {
                                color: '#888',
                                opacity: 1,
                            },
                        },
                    }}
                />
                <Button
                    variant="contained"
                    onClick={() => {
                        console.log('🖱️ [MeetingRoomChat] Send button clicked')
                        handleSendMessage()
                    }}
                    disabled={!message.trim() || !canSendMessages}
                    sx={{
                        minWidth: '60px',
                        fontSize: '12px',
                        height: 'fit-content',
                        background: canSendMessages && message.trim() 
                            ? 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)' 
                            : undefined,
                        '&:hover': {
                            background: canSendMessages && message.trim() 
                                ? 'linear-gradient(45deg, #1565c0 30%, #1976d2 90%)' 
                                : undefined,
                        }
                    }}
                >
                    📤
                </Button>
            </Box>
        </Paper>
    )
}

export default MeetingRoomChat