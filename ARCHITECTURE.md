# SkyOfficeC クライアント アーキテクチャガイド

## 推奨ディレクトリ構造

```
src/
├── components/           # React UIコンポーネント
│   ├── ui/              # 汎用UIコンポーネント
│   ├── forms/           # フォーム関連
│   ├── modals/          # モーダルダイアログ
│   ├── layout/          # レイアウトコンポーネント
│   └── game/            # ゲーム固有UI
├── hooks/               # カスタムフック
│   ├── useAppNavigation.ts
│   ├── useModalManager.ts
│   ├── useKeyboardShortcuts.ts
│   └── useGameState.ts
├── services/            # ビジネスロジック・外部連携
│   ├── WorkStatusService.ts
│   ├── ChatService.ts
│   ├── NetworkService.ts
│   └── EventBridge.ts
├── stores/              # Redux状態管理
│   ├── slices/          # Redux Toolkit slices
│   ├── middleware/      # カスタムミドルウェア
│   └── selectors/       # メモ化セレクター
├── phaser/              # Phaserゲームエンジン
│   ├── scenes/          # ゲームシーン
│   ├── entities/        # ゲームエンティティ
│   ├── systems/         # ゲームシステム
│   └── utils/           # Phaser固有ユーティリティ
├── utils/               # 汎用ユーティリティ
├── types/               # 型定義
├── constants/           # 定数
└── config/              # 設定ファイル
```

## レイヤード アーキテクチャ

### Presentation Layer (プレゼンテーション層)
- **責務**: UI表示、ユーザー入力受付
- **技術**: React, Material-UI
- **ルール**: ビジネスロジックを含まない、サービス層を呼び出す

### Application Layer (アプリケーション層)
- **責務**: ユーザーケースの実装、層間の調整
- **技術**: カスタムフック、サービスクラス
- **ルール**: UIとビジネスロジックを仲介する

### Domain Layer (ドメイン層)
- **責務**: ビジネスルール、エンティティ、値オブジェクト
- **技術**: TypeScript クラス・インターフェース
- **ルール**: 他の層に依存しない、純粋なビジネスロジック

### Infrastructure Layer (インフラ層)
- **責務**: 外部システム連携、永続化、通信
- **技術**: Colyseus, WebRTC, Phaser
- **ルール**: ドメイン層のインターフェースを実装

## 通信パターン

### 1. React ↔ Redux
```typescript
// Custom Hooksを使用した抽象化
const { workStatus, actions } = useWorkStatus()
```

### 2. Phaser ↔ React
```typescript
// EventBridge経由での通信
eventBridge.emitCustomEvent('player:clicked', { playerId })
```

### 3. Network ↔ State
```typescript
// Service層での抽象化
await workStatusService.startWork()
```

## コーディング規約

### 1. ネーミング規約
- **ファイル**: PascalCase (MyComponent.tsx)
- **フック**: use + 機能名 (useWorkStatus)
- **サービス**: 機能名 + Service (WorkStatusService)
- **イベント**: domain:action (work:started)

### 2. Import順序
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

### 3. エラーハンドリング
```typescript
// Service層でのエラーハンドリング
try {
  await workStatusService.startWork()
} catch (error) {
  console.error('Work start failed:', error)
  // UI層にエラーを伝播
  throw new WorkStatusError('Failed to start work', error)
}
```

## パフォーマンス最適化

### 1. メモ化
```typescript
// useSelector with reselect
const workStatus = useAppSelector(selectWorkStatus)

// useMemo for expensive calculations
const fatigueLevel = useMemo(() => 
  calculateFatigueLevel(startTime, currentTime), 
  [startTime, currentTime]
)
```

### 2. コンポーネント分割
```typescript
// 小さく、単一責任のコンポーネント
const WorkStatusBadge = React.memo(({ status }) => {
  // 最小限の責任のみ
})
```

### 3. 遅延ローディング
```typescript
// 大きなコンポーネントの遅延読み込み
const PlayerStatusModal = lazy(() => import('./PlayerStatusModal'))
```

## テスト戦略

### 1. 単体テスト
- **対象**: カスタムフック、サービス、ユーティリティ
- **ツール**: Jest, React Testing Library

### 2. 統合テスト
- **対象**: コンポーネントとフックの連携
- **ツール**: Jest, React Testing Library

### 3. E2Eテスト
- **対象**: ユーザーシナリオ全体
- **ツール**: Playwright, Cypress

## まとめ

このアーキテクチャにより以下が実現されます：

- ✅ **保守性**: 明確な責任分離
- ✅ **拡張性**: 新機能追加が容易
- ✅ **テスタビリティ**: 各層の独立テスト
- ✅ **可読性**: 一貫した構造とネーミング
- ✅ **再利用性**: 疎結合な設計