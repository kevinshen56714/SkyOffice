import { WorkStatus, ClothingType, AccessoryType } from '../../../types/IOfficeState'
import { eventBridge } from './EventBridge'
import { WorkStatusError, NetworkError, ValidationError } from '../types/ErrorTypes'
import phaserGame from '../PhaserGame'
import Game from '../scenes/Game'

/**
 * 勤務ステータス関連のビジネスロジックを管理するサービス
 * UI層から具体的な実装を隠蔽
 */
export class WorkStatusService {
  private static instance: WorkStatusService

  private constructor() {}

  static getInstance(): WorkStatusService {
    if (!WorkStatusService.instance) {
      WorkStatusService.instance = new WorkStatusService()
    }
    return WorkStatusService.instance
  }

  /**
   * 勤務を開始する
   */
  async startWork(): Promise<void> {
    try {
      console.log('🏢 [WorkStatusService] Starting work')
      
      // ゲームインスタンスの検証
      const game = phaserGame.scene.keys.game as Game
      if (!game) {
        throw new WorkStatusError('Game instance not found', undefined, 'GAME_NOT_FOUND')
      }
      
      // ネットワーク接続の検証
      if (!game?.network) {
        throw new NetworkError('Network connection not available', undefined, 'NETWORK_UNAVAILABLE')
      }
      
      // ネットワーク経由でサーバーに通知
      game.network.startWork()
      
      // イベントブリッジ経由でUIに通知
      eventBridge.emitCustomEvent('work:started', {
        timestamp: Date.now()
      })
      
    } catch (error) {
      console.error('❌ [WorkStatusService] Failed to start work:', error)
      
      if (error instanceof WorkStatusError || error instanceof NetworkError) {
        throw error
      }
      
      throw new WorkStatusError('Unexpected error while starting work', error as Error)
    }
  }

  /**
   * 勤務を終了する
   */
  async endWork(): Promise<void> {
    try {
      console.log('🏠 [WorkStatusService] Ending work')
      
      const game = phaserGame.scene.keys.game as Game
      if (game?.network) {
        game.network.endWork()
      }
      
      eventBridge.emitCustomEvent('work:ended', {
        timestamp: Date.now()
      })
      
    } catch (error) {
      console.error('❌ [WorkStatusService] Failed to end work:', error)
      throw error
    }
  }

  /**
   * 休憩を開始する
   */
  async startBreak(): Promise<void> {
    try {
      console.log('☕ [WorkStatusService] Starting break')
      
      const game = phaserGame.scene.keys.game as Game
      if (game?.network) {
        game.network.startBreak()
      }
      
      eventBridge.emitCustomEvent('work:breakStarted', {
        timestamp: Date.now()
      })
      
    } catch (error) {
      console.error('❌ [WorkStatusService] Failed to start break:', error)
      throw error
    }
  }

  /**
   * 休憩を終了する
   */
  async endBreak(): Promise<void> {
    try {
      console.log('💼 [WorkStatusService] Ending break')
      
      const game = phaserGame.scene.keys.game as Game
      if (game?.network) {
        game.network.endBreak()
      }
      
      eventBridge.emitCustomEvent('work:breakEnded', {
        timestamp: Date.now()
      })
      
    } catch (error) {
      console.error('❌ [WorkStatusService] Failed to end break:', error)
      throw error
    }
  }

  /**
   * 勤務ステータスを更新する
   */
  async updateWorkStatus(
    workStatus: WorkStatus, 
    clothing?: ClothingType, 
    accessory?: AccessoryType
  ): Promise<void> {
    try {
      // パラメータ検証
      if (!workStatus) {
        throw new ValidationError('Work status is required', 'workStatus', workStatus)
      }
      
      console.log('🔄 [WorkStatusService] Updating work status:', { workStatus, clothing, accessory })
      
      const game = phaserGame.scene.keys.game as Game
      if (!game) {
        throw new WorkStatusError('Game instance not found', undefined, 'GAME_NOT_FOUND')
      }
      
      if (!game?.network) {
        throw new NetworkError('Network connection not available', undefined, 'NETWORK_UNAVAILABLE')
      }
      
      game.network.updateWorkStatus(workStatus, clothing, accessory)
      
      eventBridge.emitCustomEvent('work:statusUpdated', {
        workStatus: workStatus as string,
        clothing: clothing as string,
        accessory: accessory as string,
        timestamp: Date.now()
      })
      
    } catch (error) {
      console.error('❌ [WorkStatusService] Failed to update work status:', error)
      
      if (error instanceof WorkStatusError || error instanceof NetworkError || error instanceof ValidationError) {
        throw error
      }
      
      throw new WorkStatusError('Unexpected error while updating work status', error as Error)
    }
  }

  /**
   * 疲労度を計算する
   */
  calculateFatigueLevel(workStartTime: number, currentTime: number): number {
    if (workStartTime === 0) return 0
    
    const workDurationHours = (currentTime - workStartTime) / (1000 * 60 * 60)
    
    // 8時間を基準とした疲労度計算
    if (workDurationHours <= 4) return Math.min(workDurationHours * 10, 40)
    if (workDurationHours <= 8) return Math.min(40 + (workDurationHours - 4) * 15, 100)
    return 100 // 8時間超過で最大疲労
  }

  /**
   * 労働基準法チェック
   */
  checkLaborStandards(workStartTime: number, currentTime: number): {
    isOvertime: boolean
    message?: string
  } {
    if (workStartTime === 0) return { isOvertime: false }
    
    const workDurationHours = (currentTime - workStartTime) / (1000 * 60 * 60)
    
    if (workDurationHours > 8) {
      return {
        isOvertime: true,
        message: '労働基準法に基づき、8時間を超える勤務には注意が必要です。'
      }
    }
    
    return { isOvertime: false }
  }
}

// シングルトンインスタンスをエクスポート
export const workStatusService = WorkStatusService.getInstance()