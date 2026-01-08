import { useEffect } from 'react'

interface KeyboardShortcutsOptions {
  onToggleDevMode?: () => void
  onOpenPlayerStatus?: () => void
}

/**
 * キーボードショートカットを管理するカスタムフック
 * App.tsxからキーボード関連ロジックを分離
 */
export const useKeyboardShortcuts = (options: KeyboardShortcutsOptions) => {
  const { onToggleDevMode, onOpenPlayerStatus } = options

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+I でデベロッパーモード切り替え
      if (event.ctrlKey && event.key === 'i' && onToggleDevMode) {
        event.preventDefault()
        onToggleDevMode()
      }
      
      // Sキーでプレイヤーステータスモーダルを開く機能を無効化
      // if ((event.key === 's' || event.key === 'S') && onOpenPlayerStatus) {
      //   onOpenPlayerStatus()
      // }
    }

    window.addEventListener('keydown', handleKeyDown)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onToggleDevMode, onOpenPlayerStatus])
}