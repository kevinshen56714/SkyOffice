import { useState, useEffect } from 'react'

interface ModalState {
  playerStatus: {
    open: boolean
    playerId?: string
  }
  // 将来的に他のモーダルも追加可能
}

/**
 * アプリケーション全体のモーダル状態を管理するカスタムフック
 * モーダル関連のロジックをApp.tsxから分離
 */
export const useModalManager = () => {
  const [modals, setModals] = useState<ModalState>({
    playerStatus: { open: false }
  })

  // プレイヤーステータスモーダル制御
  const openPlayerStatusModal = (playerId?: string) => {
    setModals(prev => ({
      ...prev,
      playerStatus: { open: true, playerId }
    }))
  }

  const closePlayerStatusModal = () => {
    setModals(prev => ({
      ...prev,
      playerStatus: { open: false, playerId: undefined }
    }))
  }

  // カスタムイベントリスナー
  useEffect(() => {
    const handleOpenPlayerStatusModal = (event: CustomEvent) => {
      console.log('🎯 [ModalManager] Opening player status modal:', event.detail)
      openPlayerStatusModal(event.detail?.playerId)
    }

    window.addEventListener('openPlayerStatusModal', handleOpenPlayerStatusModal as EventListener)
    
    return () => {
      window.removeEventListener('openPlayerStatusModal', handleOpenPlayerStatusModal as EventListener)
    }
  }, [])

  return {
    modals,
    playerStatus: {
      open: openPlayerStatusModal,
      close: closePlayerStatusModal
    }
  }
}