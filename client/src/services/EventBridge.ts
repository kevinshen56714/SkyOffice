import { phaserEvents, Event } from '../events/EventCenter'
import store from '../stores'
import type { CustomEventName, CustomEventTypes, TypedCustomEvent } from '../types/EventTypes'

/**
 * Phaser ↔ React 間の通信を管理するイベントブリッジ
 * 異なるイベントシステムを統一的に扱う
 */
export class EventBridge {
  private static instance: EventBridge
  private customEventHandlers = new Map<string, Function>()

  private constructor() {
    this.initializeBridge()
  }

  static getInstance(): EventBridge {
    if (!EventBridge.instance) {
      EventBridge.instance = new EventBridge()
    }
    return EventBridge.instance
  }

  /**
   * Phaserイベントを DOM Custom Event に変換
   */
  private initializeBridge() {
    // プレイヤー関連イベント
    phaserEvents.on(Event.PLAYER_JOINED, (player, key) => {
      this.emitCustomEvent('player:joined', { player, key })
    })

    phaserEvents.on(Event.PLAYER_LEFT, (key) => {
      this.emitCustomEvent('player:left', { key })
    })

    // 勤務ステータス関連イベント
    phaserEvents.on('WORK_STATUS_CHANGED', (data) => {
      this.emitCustomEvent('work:statusChanged', data)
    })
  }

  /**
   * Phaserから DOM Custom Event を発火（型安全）
   */
  emitCustomEvent<T extends CustomEventName>(
    eventName: T, 
    detail: CustomEventTypes[T]
  ) {
    console.log(`🌉 [EventBridge] Emitting custom event: ${eventName}`, detail)
    window.dispatchEvent(new CustomEvent(eventName, { detail }))
  }

  /**
   * DOM Custom Event リスナーを登録（型安全）
   */
  addEventListener<T extends CustomEventName>(
    eventName: T, 
    handler: (event: TypedCustomEvent<T>) => void
  ) {
    const wrappedHandler = (event: unknown) => handler(event as TypedCustomEvent<T>)
    window.addEventListener(eventName, wrappedHandler as EventListener)
    this.customEventHandlers.set(eventName, wrappedHandler)
  }

  /**
   * DOM Custom Event リスナーを削除
   */
  removeEventListener(eventName: string) {
    const handler = this.customEventHandlers.get(eventName)
    if (handler) {
      window.removeEventListener(eventName, handler as EventListener)
      this.customEventHandlers.delete(eventName)
    }
  }

  /**
   * Redux Action を発火（Phaserから安全にアクセス）
   */
  dispatchAction(action: any) {
    console.log('🔄 [EventBridge] Dispatching Redux action:', action.type)
    store.dispatch(action)
  }

  /**
   * 全てのリスナーをクリーンアップ
   */
  cleanup() {
    this.customEventHandlers.forEach((handler, eventName) => {
      window.removeEventListener(eventName, handler as EventListener)
    })
    this.customEventHandlers.clear()
  }
}

// シングルトンインスタンスをエクスポート
export const eventBridge = EventBridge.getInstance()