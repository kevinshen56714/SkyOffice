import React from 'react'
import styled from 'styled-components'

import { useAppDispatch } from './hooks'
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
  height: 100%;
  width: 100%;
`

/**
 * リファクタリング後のApp.tsx
 * 関心分離により各機能がカスタムフックに分離されている
 */
function App() {
    const dispatch = useAppDispatch()
    
    // ナビゲーション状態管理
    const { currentView, shouldShowVideoDialog, shouldShowHelperButtons } = useAppNavigation()
    
    // モーダル状態管理
    const { modals, playerStatus } = useModalManager()
    
    // キーボードショートカット
    useKeyboardShortcuts({
        onToggleDevMode: () => dispatch(toggleDevMode()),
        onOpenPlayerStatus: () => playerStatus.open()
    })

    // UI条件分岐の簡素化
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
    
    return (
        <>
            <Chat />
            <MobileVirtualJoystick />
            <WorkStatusPanel compact />
            
            {isDevMode && <MeetingRoomManager />}
            
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