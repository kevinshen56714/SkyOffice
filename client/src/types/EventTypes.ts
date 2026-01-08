/**
 * イベントブリッジで使用されるカスタムイベントの型定義
 */

export interface WorkStatusEventDetail {
  timestamp: number
  workStatus?: string
  clothing?: string
  accessory?: string
}

export interface PlayerEventDetail {
  player?: any
  key?: string
  playerId?: string
}

export interface CustomEventTypes {
  'work:started': WorkStatusEventDetail
  'work:ended': WorkStatusEventDetail
  'work:breakStarted': WorkStatusEventDetail
  'work:breakEnded': WorkStatusEventDetail
  'work:statusUpdated': WorkStatusEventDetail
  'work:statusChanged': WorkStatusEventDetail
  'player:joined': PlayerEventDetail
  'player:left': PlayerEventDetail
  'player:clicked': PlayerEventDetail
  'openPlayerStatusModal': PlayerEventDetail
}

export type CustomEventName = keyof CustomEventTypes

export interface TypedCustomEvent<T extends CustomEventName> extends CustomEvent {
  detail: CustomEventTypes[T]
}