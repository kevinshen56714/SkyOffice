import React from 'react'
import styled from 'styled-components'

import { useAppSelector, useAppDispatch } from './hooks'
import { useAppNavigation } from './hooks/useAppNavigation'
import { useModalManager } from './hooks/useModalManager'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useGameContent } from './hooks/useGameContent'
import { toggleDevMode } from './stores/DevModeStore'

import RoomSelectionDialog from './components/RoomSelectionDialog'
import LoginDialog from './components/LoginDialog'
import ComputerDialog from './components/ComputerDialog'
import WhiteboardDialog from './components/WhiteboardDialog'
import VideoConnectionDialog from './components/VideoConnectionDialog'
import Chat from './components/Chat'
import HelperButtonGroup from './components/HelperButtonGroup'
import MobileVirtualJoystick from './components/MobileVirtualJoystick'
import MeetingRoomManager from './components/MeetingRoomManager'
import MeetingRoomChat from './components/MeetingRoomChat'
import WorkStatusPanel from './components/WorkStatusPanel'
import PlayerStatusModal from './components/PlayerStatusModal'
import DevModePanel from './components/DevModePanel'

const Backdrop = styled.div`
  position: absolute;
  height: 100%
  width: 100%;
`

function App() {
    const dispatch = useAppDispatch()
    
    const { currentView, shouldShowVideoDialog, shouldShowHelperButtons } = useAppNavigation()
    const { modals, playerStatus } = useModalManager()
    
    useKeyboardShortcuts({
        onToggleDevMode: () => dispatch(toggleDevMode()),
        onOpenPlayerStatus: () => playerStatus.open()
    })

    const renderMainContent = () => {
        switch (currentView) {
            case 'room-selection':
                return <RoomSelectionDialog />
            case 'login':
                return <LoginDialog />
            case 'computer':
                return <ComputerDialog />
            case 'whiteboard':
                return <WhiteboardDialog />
            case 'main':
            default:
                return <MainGameContent />
        }
    }

    return (
        <Backdrop>
            {renderMainContent()}
            
            {/* 条件付きコンポーネント */}
            {shouldShowVideoDialog && <VideoConnectionDialog />}
            {shouldShowHelperButtons && <HelperButtonGroup />}
            
            {/* モーダル */}
            <PlayerStatusModal
                open={modals.playerStatus.open}
                onClose={playerStatus.close}
                playerId={modals.playerStatus.playerId}
            />
            
            {/* DevMode Panel */}
            <DevModePanel />
        </Backdrop>
    )
}

/**
 * メインゲームコンテンツを分離
 */
const MainGameContent = () => {
    const { isDevMode, currentMeetingRoomId, currentRoom, userCanSendMessages } = useGameContent()
    
    // Force render debug info
    console.log('🔄 [MainGameContent] Render check:', {
        currentMeetingRoomId,
        hasCurrentRoom: !!currentRoom,
        currentRoomName: currentRoom?.name,
        shouldShowChat: !!(currentMeetingRoomId && currentRoom),
        userCanSendMessages
    })
    
    return (
        <>
            <Chat />
            <MobileVirtualJoystick />
            <WorkStatusPanel compact />
            
            {/* Debug visualization */}
            {currentMeetingRoomId && (
                <div style={{
                    position: 'fixed',
                    top: '10px',
                    right: '10px',
                    background: 'rgba(0,0,0,0.8)',
                    color: 'white',
                    padding: '10px',
                    borderRadius: '5px',
                    zIndex: 9999,
                    fontSize: '12px'
                }}>
                    Room ID: {currentMeetingRoomId}<br/>
                    Room Found: {currentRoom ? 'Yes' : 'No'}<br/>
                    Room Name: {currentRoom?.name || 'N/A'}
                </div>
            )}
            
            {currentMeetingRoomId && currentRoom && (
                <MeetingRoomChat 
                    meetingRoomId={currentMeetingRoomId}
                    roomName={currentRoom.name || 'Unknown Room'}
                    canSendMessages={userCanSendMessages}
                />
            )}
        </>
    )
}

export default App
