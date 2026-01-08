# Claude Code メモリー

このファイルは、Claude Code がセッション間で覚えておくべき重要な情報を含んでいます。

## 🚨 重要な開発ルール
**新機能追加・変更時は必ずこのファイルを更新してください**
1. 実装した機能を「実装済み機能」セクションに追加
2. 変更したファイルを「主要ファイル」セクションに記録
3. 今後の予定があれば「開発予定」セクションを更新

## プロジェクト情報
- **メインブランチ**: master
- **現在のブランチ**: emajs
- **作業ディレクトリ**: /Users/k_yo/develop/js_work/SkyOfficeC
- **プラットフォーム**: macOS (Darwin)
- **プロジェクトタイプ**: バーチャルオフィス（Multiplayer Online Game）

## 技術スタック
- **フロントエンド**: React + TypeScript + Redux Toolkit + Phaser.js
- **バックエンド**: Node.js + TypeScript + Colyseus
- **リアルタイム通信**: WebSocket (Colyseus)
- **UI**: Material-UI + styled-components
- **ビルドツール**: Vite

## 開発コマンド
- **サーバー起動**: `npm start` (root directory)
- **クライアント開発**: `cd client && npm run dev`
- **クライアントビルド**: `cd client && npm run build`
- **型チェック**: `cd client && tsc`

## プロジェクト構造
```
SkyOfficeC/
├── client/          # フロントエンド (React + Phaser.js)
│   ├── src/
│   │   ├── components/    # React コンポーネント
│   │   ├── scenes/        # Phaser.js ゲームシーン
│   │   ├── stores/        # Redux ストア
│   │   └── services/      # Network など
├── server/          # バックエンド (Colyseus)
│   └── rooms/            # ゲームルーム管理
├── types/           # 共有型定義
└── my_modules/      # カスタムモジュール
```

## ✅ 実装済み機能

### **会議室システム**
- **権限管理**: open/private/secret の3モード
- **物理的制限**: 衝突検出による入室制御
- **参加者管理**: ホスト・招待ユーザー・参加者の管理

### **会議室チャット機能**
- **リアルタイムチャット**: Colyseus WebSocket による即座通信
- **権限ベースアクセス**: 会議室権限に応じたメッセージ送信制御
- **Optimistic Update**: メッセージ送信時の即座UI表示
- **フォーカス制御**: チャット入力中のキャラクター移動停止
- **メッセージ履歴**: 入室時の過去メッセージ表示

### **EMAシステム削除**
- **標準イベントシステム**: EMA Signal/Layer から Phaser.js イベントへ移行
- **コード簡素化**: 直接的な boolean 状態管理

### **勤務ステータス管理システム** 🆕
- **勤務状態管理**: working/break/meeting/overtime/off-duty の5状態
- **アバター外観変化**: 勤務状態に応じた服装・アクセサリー変更
- **疲労度システム**: 0-100の疲労レベル表示
- **勤務時間追跡**: リアルタイム勤務時間カウンター
- **チーム状況表示**: 全メンバーの勤務状況可視化
- **労働基準法対応**: 8時間超過時の警告表示

## 主要ファイル

### **会議室関連**
- `client/src/scenes/MeetingRoom.ts` - 会議室管理とアクセス制御
- `client/src/components/MeetingRoomChat.tsx` - チャットUI
- `server/rooms/SkyOffice.ts` - サーバー側会議室・チャット処理
- `client/src/stores/ChatStore.ts` - チャット状態管理
- `client/src/services/Network.ts` - WebSocket 通信

### **型定義**
- `types/IOfficeState.ts` - 状態とメッセージの型定義
- `types/Messages.ts` - メッセージタイプ定義

### **ユーティリティ**
- `client/src/utils/meetingRoomPermissions.ts` - 権限チェック関数

### **勤務ステータス関連** 🆕
- `types/IOfficeState.ts` - 勤務状態と外観の型定義拡張
- `server/rooms/schema/OfficeState.ts` - サーバー側スキーマ拡張
- `client/src/stores/WorkStore.ts` - 勤務状態管理Redux
- `client/src/components/WorkStatusBadge.tsx` - ステータスバッジUI
- `client/src/components/WorkTimeCounter.tsx` - 勤務時間カウンター
- `client/src/components/WorkStatusPanel.tsx` - 勤務管理パネル
- `client/src/services/Network.ts` - 勤務ステータス通信

## 🔄 開発予定

### **次の実装予定**
1. **Phaserアバター外観の実装**
   - Phaserシーン内での外観変化反映
   - スプライトテクスチャの動的変更
   - アニメーション統合

2. **時間帯による機能変化**
   - 営業時間外のアクセス制限
   - 昼夜サイクルの実装
   - 自動スケジュール機能

## 最近のコンテキスト
- **emajs ブランチ**: EMA システム削除とチャット機能実装
- **主要な課題解決**: 
  - Colyseus ArraySchema から broadcast messaging への移行
  - Redux Map → Record 変換による状態管理改善
  - リアルタイム更新の実装成功

## 開発時の注意点
- **Colyseus**: ArraySchema.onAdd より broadcast messaging を推奨
- **Redux**: Map より Record を使用（immutability 対応）
- **チャット**: 入退室ログと実際のメッセージを区別
- **権限**: サーバー・クライアント双方でチェック実装

## 🏗️ アーキテクチャ・リファクタリングガイド

### **現在の課題と改善方向**

#### **課題1: ファットコンポーネント**
```typescript
// 問題: App.tsx が多すぎる責任を持っている
❌ 17個のuseAppSelector
❌ 複数のモーダル制御
❌ キーボードイベントハンドリング
❌ 複雑な条件分岐

// 解決策: カスタムフックによる関心分離
✅ useAppNavigation() - UI状態管理
✅ useModalManager() - モーダル制御  
✅ useKeyboardShortcuts() - キーボード操作
```

#### **課題2: 直接的なStore依存**
```typescript
// 問題: PhaserクラスがRedux Storeに直接依存
❌ import store from '../stores'  // Game.ts, MyPlayer.ts
❌ store.dispatch(action)  // 直接dispatch

// 解決策: EventBridge による抽象化
✅ eventBridge.dispatchAction(action)
✅ eventBridge.emitCustomEvent(eventName, data)
```

#### **課題3: 混在するイベントシステム**
```typescript
// 問題: 3つの異なるイベントシステム
❌ Redux Actions/Reducers
❌ Phaser Events (phaserEvents)  
❌ Custom DOM Events (window.dispatchEvent)

// 解決策: EventBridge による統一
✅ eventBridge.addEventListener()
✅ eventBridge.emitCustomEvent()
```

### **推奨アーキテクチャパターン**

#### **レイヤード アーキテクチャ**
```
┌─────────────────────────────────────┐
│     Presentation Layer (React)      │  ← UI表示・ユーザー入力
├─────────────────────────────────────┤
│   Application Layer (Hooks/Services)│  ← ユーザーケース・調整
├─────────────────────────────────────┤
│      Domain Layer (Business)        │  ← ビジネスルール・エンティティ
├─────────────────────────────────────┤
│  Infrastructure Layer (Network/Phaser)│ ← 外部システム・永続化
└─────────────────────────────────────┘
```

#### **モジュール分離原則**
```typescript
// 単一責任原則 (SRP)
✅ 各モジュールは1つの責任のみ
✅ WorkStatusService → 勤務ステータス管理のみ
✅ EventBridge → イベント変換のみ

// 依存性逆転原則 (DIP)  
✅ 抽象に依存、具象に依存しない
✅ Service インターフェース定義
✅ 実装の差し替え可能性
```

### **リファクタリング実装例**

#### **カスタムフック例**
```typescript
// hooks/useAppNavigation.ts
export const useAppNavigation = () => {
  const getCurrentView = () => {
    if (!loggedIn) return roomJoined ? 'login' : 'room-selection'
    if (computerDialogOpen) return 'computer'
    return 'main'
  }
  return { currentView: getCurrentView() }
}

// hooks/useModalManager.ts  
export const useModalManager = () => {
  const [modals, setModals] = useState<ModalState>({})
  const openPlayerStatusModal = (playerId?: string) => {
    setModals(prev => ({ ...prev, playerStatus: { open: true, playerId }}))
  }
  return { modals, playerStatus: { open: openPlayerStatusModal }}
}
```

#### **サービス層例**
```typescript
// services/WorkStatusService.ts
export class WorkStatusService {
  async startWork(): Promise<void> {
    // ネットワーク通信
    const game = phaserGame.scene.keys.game as Game
    game?.network?.startWork()
    
    // イベント発火
    eventBridge.emitCustomEvent('work:started', { timestamp: Date.now() })
  }
}

// services/EventBridge.ts
export class EventBridge {
  emitCustomEvent(eventName: string, detail?: any) {
    window.dispatchEvent(new CustomEvent(eventName, { detail }))
  }
  
  dispatchAction(action: any) {
    store.dispatch(action)
  }
}
```

### **段階的リファクタリング戦略**

#### **Phase 1: カスタムフック抽出**
```typescript
1. useAppNavigation.ts - App.tsx の条件分岐ロジック
2. useModalManager.ts - モーダル状態管理
3. useKeyboardShortcuts.ts - キーボードイベント
4. useWorkStatus.ts - 勤務ステータス関連
```

#### **Phase 2: サービス層導入**
```typescript
1. WorkStatusService.ts - 勤務管理ビジネスロジック
2. ChatService.ts - チャット機能
3. NetworkService.ts - 通信抽象化
4. EventBridge.ts - イベント統一
```

#### **Phase 3: コンポーネント分割**
```typescript
1. App.tsx → 50行以下に削減
2. Game.ts → システム別分割
3. 汎用UIコンポーネント抽出
4. ビジネスロジックの分離
```

### **命名規約・ベストプラクティス**

#### **ディレクトリ構造**
```
src/
├── components/ui/      # 汎用UIコンポーネント  
├── components/game/    # ゲーム固有UI
├── hooks/              # カスタムフック
├── services/           # ビジネスロジック
├── stores/slices/      # Redux slices
├── phaser/scenes/      # Phaserシーン
├── phaser/entities/    # ゲームエンティティ
└── utils/              # 汎用ユーティリティ
```

#### **ネーミング規約**
```typescript
// ファイル名
✅ PascalCase: WorkStatusService.ts, PlayerStatusModal.tsx
✅ camelCase: useAppNavigation.ts, workStatusService.ts

// 関数・変数名
✅ use + 機能名: useWorkStatus, useModalManager
✅ 機能名 + Service: WorkStatusService, ChatService
✅ domain:action: 'work:started', 'player:clicked'
```

#### **Import順序**
```typescript
// 1. 外部ライブラリ
import React from 'react'
import { useSelector } from 'react-redux'

// 2. 内部モジュール（相対パス順）
import { useAppSelector } from '../hooks'
import { WorkStatusService } from '../services'

// 3. 型定義
import type { WorkStatus } from '../types'
```

### **テスト戦略**
```typescript
// 単体テスト
✅ カスタムフック: renderHook + act
✅ サービス: モック・スタブ活用
✅ ユーティリティ: 純粋関数テスト

// 統合テスト  
✅ コンポーネント + フック連携
✅ サービス + ネットワーク連携

// E2Eテスト
✅ ユーザーシナリオ全体
✅ Playwright/Cypress使用
```

### **参考リソース**
- **Clean Architecture**: Robert C. Martin
- **Domain-Driven Design**: Eric Evans  
- **React Patterns**: https://reactpatterns.com/
- **Redux Toolkit**: https://redux-toolkit.js.org/
- **Testing Library**: https://testing-library.com/

## デバッグ情報
- **重要なログタグ**: `[MeetingRoomChat]`, `[Network]`, `[ChatStore]`, `[Server]`
- **コンソール確認**: 送受信プロセスの詳細ログが出力される

## 📚 **ドキュメント体系** 🆕

### **新しいドキュメント管理システム**
- **場所**: `/docs/` ディレクトリ
- **開始日**: 2025-07-01
- **目的**: 修正履歴、機能仕様、トラブルシューティングの体系的管理

### **ドキュメント構造**
```
docs/
├── README.md                           # ドキュメント体系の説明
├── fixes/                              # バグ修正・技術的問題
│   ├── 2025-07-01_meeting-room-chat-rendering.md
│   └── 2025-07-01_dialog-positioning-fix.md
├── features/                           # 機能実装ガイド
│   └── meeting-room-chat.md
├── troubleshooting/                    # 共通問題と解決法
│   └── css-positioning-issues.md
└── [future directories...]
```

### **命名規則**
- **修正履歴**: `YYYY-MM-DD_short-description.md`
- **機能仕様**: `feature-name.md`
- **トラブル**: `problem-category.md`

### **最新の重要修正** 🆕
1. **会議室チャットレンダリング問題** (2025-07-01)
   - 原因: `position: absolute` → `position: fixed`
   - 影響: React UI とPhaser Canvasの重なり問題
   
2. **ダイアログ位置ずれ問題** (2025-07-01)
   - 原因: 同じCSS positioning問題
   - 解決: 全ダイアログの統一的修正

### **ベストプラクティス確立** 🆕
- **ゲーム上のReact UI**: `position: fixed` + `z-index: 9999+`
- **修正の即座記録**: 問題解決と同時にドキュメント化
- **パターン認識**: 共通問題のトラブルシューティングガイド作成

### **会議室チャット機能 - 完全実装済み** ✅
- **状態**: 完全動作・本番利用可能
- **主要修正**: CSS positioning問題解決
- **機能**: リアルタイムチャット、権限管理、履歴、UI統合
- **ドキュメント**: 完全仕様書作成済み (`docs/features/meeting-room-chat.md`)

## 🐛 最新の修正履歴

### **ビデオ通話機能修正 (2025-07-01)**
- **問題**: プレイヤー間ビデオ通話が開始されない (`otherVideoConnected: false` 状態継続)
- **原因**: 参考実装との微細な差異によるイベント処理システムの不整合
  - `Network.ts` のイベント登録メソッド欠落
  - `player.onChange` の処理順序の違い
  - `readyToConnect`/`videoConnected` イベント発火不備
- **解決方法**: 参考実装からの完全ファイル置き換え
- **修正ファイル**: `Network.ts`, `OtherPlayer.ts`, `WebRTC.ts`, `Game.ts`, `SkyOffice.ts`
- **結果**: ✅ プレイヤー間ビデオ通話が正常動作
- **詳細**: [修正レポート](./docs/fixes/2025-07-01_video-call-fix.md)

---
**最終更新**: 2025-07-01 - ビデオ通話機能修正完了