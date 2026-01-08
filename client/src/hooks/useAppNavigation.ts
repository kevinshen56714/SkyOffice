import { useAppSelector } from '../hooks'

/**
 * アプリケーションのナビゲーション状態を管理するカスタムフック
 * App.tsxの複雑な条件分岐ロジックを分離
 */
export const useAppNavigation = () => {
  const loggedIn = useAppSelector((state) => state.user.loggedIn)
  const computerDialogOpen = useAppSelector((state) => state.computer.computerDialogOpen)
  const whiteboardDialogOpen = useAppSelector((state) => state.whiteboard.whiteboardDialogOpen)
  const videoConnected = useAppSelector((state) => state.user.videoConnected)
  const roomJoined = useAppSelector((state) => state.room.roomJoined)

  // UI状態の計算ロジック
  const getCurrentView = () => {
    if (!loggedIn) {
      return roomJoined ? 'login' : 'room-selection'
    }

    if (computerDialogOpen) return 'computer'
    if (whiteboardDialogOpen) return 'whiteboard'
    
    return 'main'
  }

  const shouldShowVideoDialog = loggedIn && !videoConnected
  const shouldShowHelperButtons = !computerDialogOpen && !whiteboardDialogOpen

  return {
    currentView: getCurrentView(),
    shouldShowVideoDialog,
    shouldShowHelperButtons,
    isDialogOpen: computerDialogOpen || whiteboardDialogOpen
  }
}