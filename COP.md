# Context-Oriented Programming 導入検討

## 概要

このドキュメントでは、SkyOfficeCにContext-Oriented Programming（COP）パラダイムを導入することの可能性と実装戦略について検討します。

## 🎯 Context-Oriented Programming とは

### 核心概念

**Context-Oriented Programming (COP)** は、実行時のコンテキスト（文脈・状況）に応じてプログラムの動作を動的に変化させるプログラミングパラダイムです。

#### 主要要素

1. **Layer（レイヤー）**: 特定のコンテキストで有効になる機能群
2. **Context（コンテキスト）**: プログラムの実行環境や状況
3. **Dynamic Adaptation（動的適応）**: 実行時のコンテキスト変化に応じた自動的な動作変更

### 従来のOOPとの違い

| 観点 | OOP | COP |
|------|-----|-----|
| **機能の切り替え** | 継承・ポリモーフィズム | レイヤーの有効/無効化 |
| **変更のタイミング** | コンパイル時 | 実行時 |
| **変更の粒度** | クラス・メソッド単位 | 機能横断的 |
| **状態の表現** | オブジェクトの状態 | アクティブなコンテキスト |

## 🔍 SkyOfficeCの現状分析

### context.mdの5つの動的処理システムのEMAjs検討

現在のSkyOfficeCで実装されている5つの動的処理システムをEMAjsで再実装する検討：

#### 1. **Work Status Dynamic Processing（労働状態動的処理）**
```typescript
// context.mdの既存実装をEMAjsで表現
import { Signal, SignalComp, EMA } from '../my_modules/JSContext/EMA'

// 労働状態関連Signal
const workStatusSignal = new Signal('off-duty', 'workStatus')
const workStartTimeSignal = new Signal(null, 'workStartTime')
const fatigueSignal = new Signal(0, 'fatigueLevel')

// 労働状態レイヤー群
const WorkingLayer = {
  name: "working",
  condition: new SignalComp("workStatus == 'working'"),
  enter: function() {
    console.log('🏃‍♂️ [WorkingLayer] 勤務開始')
    // アバタースプライト自動切り替え
    this.updateAvatarSprite('working')
    // 勤務時間カウンター表示
    this.showWorkTimer()
    // Network層での勤務状態ブロードキャスト
    this.broadcastWorkStatus('working')
  },
  exit: function() {
    this.hideWorkTimer()
  }
}

const BreakLayer = {
  name: "break",
  condition: new SignalComp("workStatus == 'break'"),
  enter: function() {
    console.log('☕ [BreakLayer] 休憩開始')
    this.updateAvatarSprite('break')
    this.showBreakUI()
  }
}

const FatigueHighLayer = {
  name: "fatigueHigh",
  condition: new SignalComp("fatigueLevel > 70"),
  enter: function() {
    console.log('😴 [FatigueLayer] 高疲労状態')
    // 疲労度段階判定とアバター変更
    const fatigueCategory = this.getFatigueCategory()
    this.updateAvatarForFatigue(fatigueCategory)
    this.showFatigueWarning()
  }
}

// 複合条件レイヤー
const WorkingFatiguedLayer = {
  name: "workingFatigued", 
  condition: new SignalComp("workStatus == 'working' && fatigueLevel > 80"),
  enter: function() {
    console.log('⚠️ [WorkingFatigued] 高疲労で勤務中')
    // 強制休憩推奨
    this.showForceBreakRecommendation()
    this.updateAvatarSprite('working_exhausted')
  }
}
```

#### 2. **Fatigue Level Dynamic Processing（疲労度動的処理）**
```typescript
// 疲労度段階別レイヤー
const FatigueLowLayer = {
  name: "fatigueLow",
  condition: new SignalComp("fatigueLevel <= 30"),
  enter: function() {
    console.log('😊 [FatigueLow] 通常状態')
    this.setAvatarFatigueState('normal')
  }
}

const FatigueMediumLayer = {
  name: "fatigueMedium", 
  condition: new SignalComp("fatigueLevel > 30 && fatigueLevel <= 70"),
  enter: function() {
    console.log('😐 [FatigueMedium] 疲労状態')
    this.setAvatarFatigueState('tired')
    this.showMildFatigueIndicator()
  }
}

const FatigueHighLayer = {
  name: "fatigueHigh",
  condition: new SignalComp("fatigueLevel > 70"),
  enter: function() {
    console.log('😵 [FatigueHigh] 重疲労状態')
    this.setAvatarFatigueState('exhausted')
    this.showCriticalFatigueWarning()
    // 将来実装: 移動速度低下
    this.reduceMovementSpeed(0.7)
  }
}

// アバターマッピングの動的処理
const avatarUpdateMethod = function() {
  const signals = EMA.getSignals()
  const sprite = this.getAvatarSprite(
    signals.baseAvatar.value,
    signals.workStatus.value, 
    signals.fatigueLevel.value
  )
  this.myPlayer.setTexture(sprite)
}
```

#### 3. **Meeting Room Permission Dynamic Processing（会議室権限動的処理）**
```typescript
// 会議室権限関連Signal
const roomModeSignal = new Signal('open', 'roomMode')
const userRoleSignal = new Signal('employee', 'userRole')
const currentRoomSignal = new Signal(null, 'currentRoom')

// 権限レイヤー群
const OpenRoomLayer = {
  name: "openRoom",
  condition: new SignalComp("roomMode == 'open'"),
  enter: function() {
    console.log('🏢 [OpenRoom] オープンルームモード')
    this.enableRoomAccess(true)
    this.showPublicRoomUI()
  }
}

const PrivateRoomLayer = {
  name: "privateRoom",
  condition: new SignalComp("roomMode == 'private'"),
  enter: function() {
    console.log('🔒 [PrivateRoom] プライベートルームモード')
    // 招待ユーザーのみアクセス可能
    this.enforceInvitationCheck()
    this.showPrivateRoomUI()
  }
}

const SecretRoomLayer = {
  name: "secretRoom", 
  condition: new SignalComp("roomMode == 'secret'"),
  enter: function() {
    console.log('🕵️ [SecretRoom] シークレットルームモード')
    // ホストのみアクセス、リストから非表示
    this.enforceHostOnlyAccess()
    this.hideFromRoomList()
  }
}

const AdminAccessLayer = {
  name: "adminAccess",
  condition: new SignalComp("userRole == 'admin' || isDevMode == true"),
  enter: function() {
    console.log('👑 [AdminAccess] 管理者権限有効')
    this.enableAllRoomAccess()
    this.showAdminControls()
  }
}
```

#### 4. **Visual Edit Mode Dynamic Processing（編集モード動的処理）**
```typescript
// 編集モード関連Signal
const editModeSignal = new Signal(false, 'editMode')
const selectedRoomSignal = new Signal(null, 'selectedRoom')

const VisualEditLayer = {
  name: "visualEdit",
  condition: new SignalComp("editMode == true"),
  enter: function() {
    console.log('✏️ [VisualEdit] 編集モード開始')
    // 既存MeetingRoomManager非表示
    this.meetingRoomManager.hideRoomAreas()
    // 編集可能エリア作成
    this.createEditableRoomAreas()
    // DOM-basedドラッグシステム有効化
    this.enableDragSystem()
  },
  exit: function() {
    console.log('✏️ [VisualEdit] 編集モード終了')
    this.clearEditableRoomAreas()
    this.meetingRoomManager.showRoomAreas()
    this.disableDragSystem()
  }
}

const RoomDraggingLayer = {
  name: "roomDragging",
  condition: new SignalComp("editMode == true && selectedRoom != null"),
  enter: function() {
    console.log('🖱️ [RoomDragging] ルームドラッグ中')
    this.showDragFeedback()
    // リアルタイム位置更新
    this.enableRealTimePositionUpdate()
  }
}

// Partial Methodでドラッグ処理拡張
EMA.addPartialMethod(VisualEditLayer, gameInstance, 'updateRoomPosition', 
  function(roomId, x, y) {
    // Redux位置データ更新
    this.updateRoomPositionInStore(roomId, x, y)
    // グローバル関数経由でDevModePanel連携
    window.devModeUpdateRoomArea(roomId, {x, y})
  }
)
```

#### 5. **DevMode Dynamic Processing（DevMode動的処理）**
```typescript
// DevMode関連Signal
const devModeSignal = new Signal(false, 'isDevMode')
const devTabSignal = new Signal(0, 'devTabValue')

const DevModeActiveLayer = {
  name: "devModeActive",
  condition: new SignalComp("isDevMode == true"),
  enter: function() {
    console.log('🛠️ [DevModeActive] 開発モード有効')
    // 7タブDevModePanelの表示
    this.showDevModePanel()
    // デバッグ機能有効化
    this.enableDebugFeatures()
    // 全システムへのアクセス許可
    this.enableSystemAccess()
  },
  exit: function() {
    this.hideDevModePanel()
    this.disableDebugFeatures()
  }
}

const DevModeLoggingLayer = {
  name: "devModeLogging",
  condition: new SignalComp("isDevMode == true"),
  enter: function() {
    console.log('📊 [DevModeLogging] 詳細ログ有効')
    // リアルタイムログ監視
    this.enableDetailedLogging()
    // ログフィルタリング機能
    this.setupLogFiltering()
  }
}

const DevModeTestingLayer = {
  name: "devModeTesting",
  condition: new SignalComp("isDevMode == true && devTabValue == 5"), // Mockタブ
  enter: function() {
    console.log('🧪 [DevModeTesting] テストモード')
    // モックデータ生成機能
    this.enableMockDataGeneration()
    // テストシナリオ実行
    this.enableTestScenarios()
  }
}

// DevModeでの状態操作拡張
EMA.addPartialMethod(DevModeActiveLayer, gameInstance, 'updateAnyState',
  function(stateType, value) {
    console.log(`🔧 [DevMode] ${stateType}を${value}に変更`)
    // 任意の状態変更を許可
    switch(stateType) {
      case 'workStatus':
        EMA.getSignals().workStatus.value = value
        break
      case 'fatigueLevel':
        EMA.getSignals().fatigueLevel.value = value
        break
      case 'roomMode':
        EMA.getSignals().roomMode.value = value
        break
    }
  }
)
```

### 現在のアーキテクチャの課題

#### 1. **責任の混在**
```typescript
// 問題のあるコード例
const handleStartWork = () => {
    dispatch(startWork())        // Redux更新
    game.network.startWork()     // Network通信
    // UI層で複数の責任を持っている
}
```

#### 2. **コンテキスト判定の分散**
```typescript
// 各所に散らばったコンテキスト判定
if (workStatus === 'working' && fatigueLevel > 70) { /* ... */ }
if (room.mode === 'private' && !isInvited) { /* ... */ }
if (isDevMode && hasPermission) { /* ... */ }
```

#### 3. **動的変更の複雑性**
- レイヤー間の依存関係が不明確
- コンテキスト変化時の影響範囲が把握困難
- テストケースの網羅が困難

## ⚖️ COP導入のメリット・デメリット

### ✅ メリット

#### 1. **関心の分離**
```typescript
// COPによる改善例
class WorkStatusLayer extends Layer {
  isActive(): boolean {
    return this.context.workStatus === 'working'
  }
  
  effects(): LayerEffects {
    return {
      avatar: { sprite: 'working_normal' },
      ui: { showWorkTimer: true },
      restrictions: { canTakeBreak: false }
    }
  }
}
```

#### 2. **テスタビリティの向上**
```typescript
// レイヤー単位でのテスト
describe('WorkStatusLayer', () => {
  it('should activate when work status is working', () => {
    const context = { workStatus: 'working' }
    const layer = new WorkStatusLayer(context)
    expect(layer.isActive()).toBe(true)
  })
})
```

#### 3. **保守性の向上**
- 機能追加時の影響範囲の限定
- レイヤー単位での機能の有効/無効化
- 宣言的なコンテキスト定義

#### 4. **拡張性**
```typescript
// 新しいコンテキストの追加が容易
class NightModeLayer extends Layer {
  isActive(): boolean {
    return this.context.timeOfDay === 'night'
  }
  
  effects(): LayerEffects {
    return {
      ui: { theme: 'dark' },
      avatar: { visibility: 0.8 },
      sounds: { volume: 0.5 }
    }
  }
}
```

### ❌ デメリット

#### 1. **学習コスト**
- 開発チームがCOPパラダイムを理解する必要
- 新しい設計パターンの習得コスト

#### 2. **実装複雑度**
```typescript
// ContextManagerの複雑性
class ContextManager {
  private layers: Layer[] = []
  private context: Context = {}
  
  updateContext(newContext: Partial<Context>) {
    this.context = { ...this.context, ...newContext }
    this.recalculateLayers()
    this.applyEffects()
  }
  
  private recalculateLayers() {
    // レイヤー依存関係の解決
    // 優先順位の計算
    // 競合解決
  }
}
```

#### 3. **パフォーマンスオーバーヘッド**
- コンテキスト変化時の再計算コスト
- レイヤー評価のオーバーヘッド
- メモリ使用量の増加

#### 4. **デバッグの複雑性**
- どのレイヤーが有効かの追跡
- レイヤー間の相互作用の理解
- 動的な動作変更の予測困難性

## 🛠️ 具体的な実装提案

### 1. EMAjsを使ったContext定義

```typescript
// EMAjsのSignalを使ったリアクティブコンテキスト
import { Signal, SignalComp, EMA } from '../my_modules/JSContext/EMA'

// コンテキストSignalの定義
export class SkyOfficeSignals {
  // 勤務関連シグナル
  workStatus = new Signal('off-duty', 'workStatus')
  workStartTime = new Signal(null, 'workStartTime')
  fatigueLevel = new Signal(0, 'fatigueLevel')
  breakCount = new Signal(0, 'breakCount')
  
  // 位置関連シグナル
  currentArea = new Signal('lobby', 'currentArea')
  roomId = new Signal(null, 'roomId')
  playerX = new Signal(0, 'playerX')
  playerY = new Signal(0, 'playerY')
  nearbyPlayersCount = new Signal(0, 'nearbyPlayersCount')
  
  // 権限関連シグナル
  userRole = new Signal('employee', 'userRole')
  isDevMode = new Signal(false, 'isDevMode')
  adminOverride = new Signal(false, 'adminOverride')
  
  // 時間関連シグナル
  timeOfDay = new Signal('morning', 'timeOfDay')
  workingHours = new Signal(true, 'workingHours')
  isHoliday = new Signal(false, 'isHoliday')
  
  // 通信関連シグナル
  videoEnabled = new Signal(false, 'videoEnabled')
  audioEnabled = new Signal(false, 'audioEnabled')
  isInCall = new Signal(false, 'isInCall')
  
  constructor() {
    // ReduxストアとSignalの双方向バインディング
    this.setupStoreBinding()
  }
  
  private setupStoreBinding() {
    // Redux状態変更をSignalに反映
    store.subscribe(() => {
      const state = store.getState()
      this.workStatus.value = state.work.workStatus
      this.fatigueLevel.value = state.work.fatigueLevel
      this.isDevMode.value = state.devMode.isDevMode
      // 他のシグナル更新...
    })
  }
  
  // Signalインターフェースオブジェクト（EMA.exhibit用）
  getSignalInterface() {
    return {
      // 勤務関連
      workStatus: this.workStatus,
      workStartTime: this.workStartTime,
      fatigueLevel: this.fatigueLevel,
      breakCount: this.breakCount,
      
      // 位置関連
      currentArea: this.currentArea,
      roomId: this.roomId,
      playerX: this.playerX,
      playerY: this.playerY,
      nearbyPlayersCount: this.nearbyPlayersCount,
      
      // 権限関連
      userRole: this.userRole,
      isDevMode: this.isDevMode,
      adminOverride: this.adminOverride,
      
      // 時間関連
      timeOfDay: this.timeOfDay,
      workingHours: this.workingHours,
      isHoliday: this.isHoliday,
      
      // 通信関連
      videoEnabled: this.videoEnabled,
      audioEnabled: this.audioEnabled,
      isInCall: this.isInCall
    }
  }
}
```

### 2. EMAjsレイヤー定義

```typescript
// EMAjsの標準レイヤー形式を使用
import { EMA, SignalComp } from '../my_modules/JSContext/EMA'

// 勤務状態関連レイヤー
export const WorkingLayer = {
  name: "working",
  condition: new SignalComp("workStatus == 'working'"),
  
  enter: function() {
    console.log('🏃‍♂️ [WorkingLayer] Entering working state')
    // アバター変更
    this.updateAvatarForWorking()
    // UI更新
    this.showWorkingUI()
  },
  
  exit: function() {
    console.log('🏃‍♂️ [WorkingLayer] Exiting working state')
    this.hideWorkingUI()
  }
}

export const HighFatigueLayer = {
  name: "highFatigue",
  condition: new SignalComp("fatigueLevel > 80"),
  
  enter: function() {
    console.log('😴 [HighFatigueLayer] High fatigue detected')
    // 疲労状態のアバターに変更
    this.updateAvatarForFatigue()
    // 休憩推奨UI表示
    this.showFatigueWarning()
  },
  
  exit: function() {
    console.log('😴 [HighFatigueLayer] Fatigue level decreased')
    this.hideFatigueWarning()
  }
}

export const DevModeLayer = {
  name: "devMode",
  condition: new SignalComp("isDevMode == true"),
  
  enter: function() {
    console.log('🛠️ [DevModeLayer] DevMode activated')
    // DevModeパネル表示
    this.showDevModePanel()
    // デバッグ機能有効化
    this.enableDebugFeatures()
  },
  
  exit: function() {
    console.log('🛠️ [DevModeLayer] DevMode deactivated')
    this.hideDevModePanel()
    this.disableDebugFeatures()
  }
}

export const MeetingRoomLayer = {
  name: "meetingRoom",
  condition: new SignalComp("currentArea == 'meeting-room'"),
  
  enter: function() {
    console.log('🏢 [MeetingRoomLayer] Entered meeting room')
    // ルーム固有チャットに切り替え
    this.switchToRoomChat()
    // ルーム管理UI表示
    this.showRoomControls()
  },
  
  exit: function() {
    console.log('🏢 [MeetingRoomLayer] Left meeting room')
    // グローバルチャットに戻る
    this.switchToGlobalChat()
    this.hideRoomControls()
  }
}

// 複合条件レイヤー
export const WorkingWithHighFatigueLayer = {
  name: "workingHighFatigue",
  condition: new SignalComp("workStatus == 'working' && fatigueLevel > 80"),
  
  enter: function() {
    console.log('⚠️ [WorkingWithHighFatigue] Working while highly fatigued')
    // 強制休憩推奨
    this.showForceBreakRecommendation()
    // パフォーマンス低下エフェクト
    this.applyFatigueEffects()
  },
  
  exit: function() {
    console.log('⚠️ [WorkingWithHighFatigue] Fatigue or work status changed')
    this.hideForceBreakRecommendation()
    this.removeFatigueEffects()
  }
}

// 時間ベースレイヤー
export const OvertimeLayer = {
  name: "overtime",
  condition: new SignalComp("workStatus == 'working' && workingHours == false"),
  
  enter: function() {
    console.log('🌙 [OvertimeLayer] Working overtime')
    // 残業警告表示
    this.showOvertimeWarning()
    // 疲労度蓄積率増加
    this.increaseFatigueRate()
  },
  
  exit: function() {
    console.log('🌙 [OvertimeLayer] Overtime ended')
    this.hideOvertimeWarning()
    this.resetFatigueRate()
  }
}

// 権限ベースレイヤー
export const AdminLayer = {
  name: "admin",
  condition: new SignalComp("userRole == 'admin' || adminOverride == true"),
  
  enter: function() {
    console.log('👑 [AdminLayer] Admin privileges activated')
    // 管理機能UI表示
    this.showAdminControls()
    // 全ルームアクセス許可
    this.enableAllRoomAccess()
  },
  
  exit: function() {
    console.log('👑 [AdminLayer] Admin privileges deactivated')
    this.hideAdminControls()
    this.disableAllRoomAccess()
  }
}
```

### 3. EMAjsを使ったPartial Methods実装

```typescript
// EMAjsのPartial Methodsを使用してメソッドの動的拡張
import { EMA } from '../my_modules/JSContext/EMA'

// ゲームオブジェクトの定義
class SkyOfficeGame {
  myPlayer: any
  ui: any
  network: any
  
  // 基本的なアバター更新メソッド
  updateAvatar() {
    console.log('🎮 [Game] Basic avatar update')
    // 通常のアバター表示
    this.myPlayer.setTexture('default_avatar')
  }
  
  // 基本的なUI表示メソッド
  showUI() {
    console.log('🎮 [Game] Basic UI display')
    // 標準UI表示
    this.ui.showDefault()
  }
  
  // 基本的なチャット切り替えメソッド
  switchChat() {
    console.log('💬 [Game] Basic chat mode')
    // デフォルトチャット
    this.ui.showGlobalChat()
  }
}

// EMAjsを使ったPartial Methods定義
const gameInstance = new SkyOfficeGame()

// 勤務中のアバター変更
EMA.addPartialMethod(
  WorkingLayer,
  gameInstance,
  'updateAvatar',
  function() {
    console.log('🏃‍♂️ [WorkingLayer] Working avatar applied')
    // 勤務中のアバター
    this.myPlayer.setTexture('working_avatar')
    // 疲労度に応じた調整
    const signals = EMA.getSignals()
    if (signals.fatigueLevel.value > 70) {
      this.myPlayer.setTexture('working_tired_avatar')
    }
    // 元メソッドも実行（必要に応じて）
    // Layer.proceed()
  }
)

// 高疲労時のアバター変更
EMA.addPartialMethod(
  HighFatigueLayer,
  gameInstance,
  'updateAvatar',
  function() {
    console.log('😴 [HighFatigueLayer] Tired avatar applied')
    // 疲労状態のアバター（優先度が高い）
    this.myPlayer.setTexture('exhausted_avatar')
    this.myPlayer.setAlpha(0.8) // 透明度で疲労を表現
  }
)

// DevMode時のUI拡張
EMA.addPartialMethod(
  DevModeLayer,
  gameInstance,
  'showUI',
  function() {
    console.log('🛠️ [DevModeLayer] DevMode UI applied')
    // 元のUI表示
    Layer.proceed()
    // DevModeパネルを追加
    this.ui.showDevModePanel()
    this.ui.showDebugInfo()
  }
)

// 会議室でのチャット切り替え
EMA.addPartialMethod(
  MeetingRoomLayer,
  gameInstance,
  'switchChat',
  function() {
    console.log('🏢 [MeetingRoomLayer] Room chat activated')
    // ルーム固有チャットに切り替え
    const signals = EMA.getSignals()
    const roomId = signals.roomId.value
    this.ui.showRoomChat(roomId)
    this.ui.hideGlobalChat()
  }
)

// 複合条件での動作変更
EMA.addPartialMethod(
  WorkingWithHighFatigueLayer,
  gameInstance,
  'updateAvatar',
  function() {
    console.log('⚠️ [WorkingWithHighFatigue] Critical fatigue warning')
    // 警告状態のアバター
    this.myPlayer.setTexture('critical_fatigue_avatar')
    this.myPlayer.setTint(0xff0000) // 赤色で警告
    
    // 追加の警告エフェクト
    this.ui.showCriticalFatigueWarning()
    this.ui.showForceBreakDialog()
  }
)
```

### 4. EMAjsシステム管理クラス

```typescript
// EMAjsを使ったSkyOfficeのコンテキスト管理
import { EMA, Signal, SignalComp } from '../my_modules/JSContext/EMA'

export class SkyOfficeContextManager {
  private signals: SkyOfficeSignals
  private gameInstance: SkyOfficeGame
  private layers: any[] = []
  
  constructor(gameInstance: SkyOfficeGame) {
    this.gameInstance = gameInstance
    this.signals = new SkyOfficeSignals()
    this.initializeEMASystem()
  }
  
  private initializeEMASystem() {
    console.log('🚀 [ContextManager] Initializing EMAjs system')
    
    // シグナルをEMAに公開
    EMA.exhibit(this.gameInstance, this.signals.getSignalInterface())
    
    // 全レイヤーをデプロイ
    this.deployAllLayers()
    
    // システムイベントの監視を開始
    this.setupSystemMonitoring()
  }
  
  private deployAllLayers() {
    // 基本レイヤーのデプロイ
    this.layers = [
      WorkingLayer,
      HighFatigueLayer,
      DevModeLayer,
      MeetingRoomLayer,
      WorkingWithHighFatigueLayer,
      OvertimeLayer,
      AdminLayer
    ]
    
    this.layers.forEach(layer => {
      console.log(`📋 [ContextManager] Deploying layer: ${layer.name}`)
      EMA.deploy(layer)
    })
  }
  
  private setupSystemMonitoring() {
    // Redux状態変更の監視
    store.subscribe(() => {
      const state = store.getState()
      this.updateSignalsFromRedux(state)
    })
    
    // Phaser位置情報の監視
    if (this.gameInstance.myPlayer) {
      this.gameInstance.myPlayer.on('move', (x: number, y: number) => {
        this.signals.playerX.value = x
        this.signals.playerY.value = y
      })
    }
    
    // 時間ベースの更新
    setInterval(() => {
      this.updateTemporalSignals()
    }, 60000) // 1分ごと
  }
  
  private updateSignalsFromRedux(state: any) {
    // 勤務関連の更新
    if (state.work.workStatus !== this.signals.workStatus.value) {
      console.log(`📊 [ContextManager] Work status changed: ${state.work.workStatus}`)
      this.signals.workStatus.value = state.work.workStatus
    }
    
    if (state.work.fatigueLevel !== this.signals.fatigueLevel.value) {
      console.log(`😴 [ContextManager] Fatigue level changed: ${state.work.fatigueLevel}`)
      this.signals.fatigueLevel.value = state.work.fatigueLevel
    }
    
    // DevMode状態の更新
    if (state.devMode.isDevMode !== this.signals.isDevMode.value) {
      console.log(`🛠️ [ContextManager] DevMode changed: ${state.devMode.isDevMode}`)
      this.signals.isDevMode.value = state.devMode.isDevMode
    }
    
    // ルーム状態の更新
    const currentArea = state.room.roomJoined ? 'meeting-room' : 'lobby'
    if (currentArea !== this.signals.currentArea.value) {
      console.log(`🏢 [ContextManager] Area changed: ${currentArea}`)
      this.signals.currentArea.value = currentArea
    }
    
    // 権限関連の更新
    if (state.user.role !== this.signals.userRole.value) {
      console.log(`👑 [ContextManager] User role changed: ${state.user.role}`)
      this.signals.userRole.value = state.user.role
    }
  }
  
  private updateTemporalSignals() {
    const now = new Date()
    const hour = now.getHours()
    
    // 時間帯の判定
    let timeOfDay: string
    if (hour >= 6 && hour < 12) timeOfDay = 'morning'
    else if (hour >= 12 && hour < 18) timeOfDay = 'afternoon'
    else if (hour >= 18 && hour < 22) timeOfDay = 'evening'
    else timeOfDay = 'night'
    
    if (timeOfDay !== this.signals.timeOfDay.value) {
      console.log(`🌅 [ContextManager] Time of day changed: ${timeOfDay}`)
      this.signals.timeOfDay.value = timeOfDay
    }
    
    // 営業時間の判定（9:00-18:00）
    const workingHours = hour >= 9 && hour < 18
    if (workingHours !== this.signals.workingHours.value) {
      console.log(`⏰ [ContextManager] Working hours changed: ${workingHours}`)
      this.signals.workingHours.value = workingHours
    }
  }
  
  // 外部からのシグナル更新メソッド
  updateWorkStatus(status: string) {
    console.log(`🔄 [ContextManager] Manual work status update: ${status}`)
    this.signals.workStatus.value = status
  }
  
  updateFatigueLevel(level: number) {
    console.log(`🔄 [ContextManager] Manual fatigue level update: ${level}`)
    this.signals.fatigueLevel.value = Math.max(0, Math.min(100, level))
  }
  
  updateLocation(area: string, roomId?: string) {
    console.log(`🔄 [ContextManager] Manual location update: ${area}`)
    this.signals.currentArea.value = area
    if (roomId) {
      this.signals.roomId.value = roomId
    }
  }
  
  // デバッグ用メソッド
  getActiveLayersInfo() {
    const activeLayers = EMA.getActiveLayers()
    console.log('📋 [ContextManager] Active layers:', activeLayers.map(l => l.name))
    return activeLayers
  }
  
  getSignalsInfo() {
    const signals = this.signals.getSignalInterface()
    const signalValues: any = {}
    Object.keys(signals).forEach(key => {
      signalValues[key] = signals[key].value
    })
    console.log('📊 [ContextManager] Current signals:', signalValues)
    return signalValues
  }
  
  // システム停止
  shutdown() {
    console.log('🛑 [ContextManager] Shutting down EMAjs system')
    this.layers.forEach(layer => {
      EMA.undeploy(layer)
    })
  }
}

// 使用例
export function initializeSkyOfficeEMA(gameInstance: SkyOfficeGame) {
  const contextManager = new SkyOfficeContextManager(gameInstance)
  
  // グローバルアクセス用（デバッグ用）
  (window as any).skyOfficeContext = contextManager
  
  return contextManager
}
```

### 5. EMAjsと既存システムの統合例

```typescript
// EMAjsをSkyOfficeCの既存システムに統合する実装例
import { initializeSkyOfficeEMA } from './SkyOfficeContextManager'

// Game.tsでの統合
export class Game extends Phaser.Scene {
  private contextManager: SkyOfficeContextManager
  myPlayer: MyPlayer
  network: Network
  
  create() {
    // 既存の初期化処理...
    this.setupPlayers()
    this.setupNetwork()
    
    // EMAjsシステムの初期化
    this.contextManager = initializeSkyOfficeEMA(this)
    
    // EMAjsの動作確認
    this.testEMAIntegration()
  }
  
  private testEMAIntegration() {
    console.log('🧪 [Game] Testing EMAjs integration')
    
    // 勤務状態の変更テスト
    setTimeout(() => {
      console.log('🧪 [Game] Testing work status change')
      this.contextManager.updateWorkStatus('working')
    }, 2000)
    
    // 疲労度の変更テスト
    setTimeout(() => {
      console.log('🧪 [Game] Testing fatigue level change')
      this.contextManager.updateFatigueLevel(85)
    }, 4000)
    
    // DevModeの切り替えテスト
    setTimeout(() => {
      console.log('🧪 [Game] Testing DevMode toggle')
      store.dispatch(setDevmode(true))
    }, 6000)
  }
  
  // 既存メソッドにEMAjs対応を追加
  updateAvatar() {
    // このメソッドはEMAjsのPartial Methodsによって拡張される
    console.log('🎮 [Game] Base avatar update')
    if (this.myPlayer) {
      this.myPlayer.setTexture('default_avatar')
    }
  }
  
  showUI() {
    // このメソッドもEMAjsによって拡張される
    console.log('🎮 [Game] Base UI display')
    // 基本UI表示ロジック
  }
  
  switchChat() {
    // チャット切り替えもEMAjsで管理
    console.log('💬 [Game] Base chat switch')
    // デフォルトチャット表示
  }
}

// DevModePanel.tsxでのEMAjs統合
export const DevModePanel: React.FC = () => {
  const [emaInfo, setEmaInfo] = useState<any>({})
  
  useEffect(() => {
    // EMAjsシステム情報の定期更新
    const interval = setInterval(() => {
      if ((window as any).skyOfficeContext) {
        const contextManager = (window as any).skyOfficeContext
        setEmaInfo({
          activeLayers: contextManager.getActiveLayersInfo(),
          signals: contextManager.getSignalsInfo()
        })
      }
    }, 1000)
    
    return () => clearInterval(interval)
  }, [])
  
  // EMAjsテスト用ボタン
  const testEMAFunctions = () => {
    const contextManager = (window as any).skyOfficeContext
    if (!contextManager) return
    
    // 各種テストシナリオ
    console.log('🧪 [DevMode] Running EMAjs tests')
    
    // 1. 勤務状態サイクルテスト
    contextManager.updateWorkStatus('working')
    setTimeout(() => contextManager.updateFatigueLevel(90), 1000)
    setTimeout(() => contextManager.updateWorkStatus('break'), 2000)
    setTimeout(() => contextManager.updateFatigueLevel(30), 3000)
  }
  
  return (
    <Box>
      {/* 既存のDevModeパネル内容 */}
      
      {/* EMAjs情報表示セクション */}
      <Typography variant="h6">🎯 EMAjs Context System</Typography>
      
      <Box>
        <Typography variant="subtitle2">Active Layers:</Typography>
        {emaInfo.activeLayers?.map((layer: any, index: number) => (
          <Chip key={index} label={layer.name} size="small" />
        ))}
      </Box>
      
      <Box>
        <Typography variant="subtitle2">Current Signals:</Typography>
        <pre style={{ fontSize: '10px' }}>
          {JSON.stringify(emaInfo.signals, null, 2)}
        </pre>
      </Box>
      
      <Button onClick={testEMAFunctions} variant="outlined" size="small">
        🧪 Test EMAjs Functions
      </Button>
    </Box>
  )
}

// WorkStatusService.tsでのEMAjs統合
export class WorkStatusService {
  private contextManager: SkyOfficeContextManager | null = null
  
  constructor() {
    // EMAjsシステムとの連携
    if ((window as any).skyOfficeContext) {
      this.contextManager = (window as any).skyOfficeContext
    }
  }
  
  async startWork(): Promise<void> {
    console.log('💼 [WorkStatusService] Starting work with EMAjs')
    
    // 1. Redux Store更新
    store.dispatch(startWork())
    
    // 2. Network通信
    const game = phaserGame.scene.keys.game as Game
    game?.network?.startWork()
    
    // 3. EMAjsシグナル更新（自動でRedux監視により更新される）
    // this.contextManager?.updateWorkStatus('working') // 必要に応じて手動更新
  }
  
  async endWork(): Promise<void> {
    console.log('💼 [WorkStatusService] Ending work with EMAjs')
    
    store.dispatch(endWork())
    const game = phaserGame.scene.keys.game as Game
    game?.network?.endWork()
  }
  
  async setFatigueLevel(level: number): Promise<void> {
    console.log(`😴 [WorkStatusService] Setting fatigue level: ${level}`)
    
    // Redux更新
    store.dispatch(setFatigueLevel(level))
    
    // EMAjsへの直接更新（即座な反映のため）
    this.contextManager?.updateFatigueLevel(level)
  }
}

// App.tsxでの初期化
export const App: React.FC = () => {
  useEffect(() => {
    // アプリ起動時のEMAjsシステム確認
    setTimeout(() => {
      if ((window as any).skyOfficeContext) {
        console.log('✅ [App] EMAjs system is ready')
        const contextManager = (window as any).skyOfficeContext
        contextManager.getActiveLayersInfo()
        contextManager.getSignalsInfo()
      } else {
        console.warn('⚠️ [App] EMAjs system not initialized')
      }
    }, 3000)
  }, [])
  
  return (
    <div>
      {/* 既存のアプリケーション内容 */}
    </div>
  )
}
```

## 📋 段階的導入戦略

### Phase 1: 基盤整備（1-2週間）

#### 目標
- COP基盤クラスの実装
- 基本的なContext定義
- 既存システムとの最小限の統合

#### 作業項目
1. **基盤クラス実装**
   - `Layer` 抽象クラス
   - `ContextManager` クラス
   - `SkyOfficeContext` 型定義

2. **最初のレイヤー実装**
   - `WorkingLayer`
   - `DevModeLayer`

3. **統合テスト**
   - 基本的なレイヤー切り替え
   - コンテキスト更新

### Phase 2: 勤務状態システムの移行（2-3週間）

#### 目標
- 既存の勤務状態管理をCOPパターンに移行
- WorkStore.tsの段階的リファクタリング

#### 作業項目
1. **勤務関連レイヤー実装**
   - `WorkingLayer`, `BreakLayer`, `MeetingLayer`
   - `FatigueLayer`, `OvertimeLayer`

2. **WorkStore.ts統合**
   - ContextServiceとの連携
   - 既存のReact Componentの段階的更新

3. **テストカバレッジ拡張**

### Phase 3: 権限・位置システムの移行（2-3週間）

#### 目標
- 会議室権限システムをCOPに移行
- 位置ベースの機能制御

#### 作業項目
1. **権限・位置レイヤー実装**
   - `AdminLayer`, `ManagerLayer`
   - `LobbyLayer`, `MeetingRoomLayer`

2. **既存システムとの統合**
   - MeetingRoomStore.tsの更新
   - Game.tsの位置情報統合

### Phase 4: 拡張機能と最適化（1-2週間）

#### 目標
- 新しいコンテキストの追加
- パフォーマンス最適化

#### 作業項目
1. **新機能レイヤー**
   - `NightModeLayer`
   - `HighTrafficLayer`

2. **最適化**
   - レイヤー評価のメモ化
   - 不要な再計算の削減

## ⚡ パフォーマンス・保守性考慮

### パフォーマンス最適化

#### 1. **レイヤー評価の最適化**
```typescript
class OptimizedContextManager extends ContextManager {
  private layerCache = new Map<string, boolean>()
  private effectsCache = new Map<string, LayerEffects>()
  
  private shouldRecalculate(contextChange: Partial<SkyOfficeContext>): boolean {
    // 影響のあるレイヤーのみ再評価
    return this.layers.some(layer => 
      layer.isAffectedBy(contextChange)
    )
  }
}
```

#### 2. **メモ化の活用**
```typescript
class MemoizedLayer extends Layer {
  private memoizedEffects: LayerEffects | null = null
  private lastContextHash: string = ''
  
  getEffects(): LayerEffects {
    const currentHash = this.hashContext()
    if (currentHash === this.lastContextHash && this.memoizedEffects) {
      return this.memoizedEffects
    }
    
    this.memoizedEffects = this.calculateEffects()
    this.lastContextHash = currentHash
    return this.memoizedEffects
  }
}
```

### テスト戦略

#### 1. **レイヤー単体テスト**
```typescript
describe('WorkingLayer', () => {
  it('activates when work status is working', () => {
    const context = createTestContext({ work: { status: 'working' } })
    const layer = new WorkingLayer(context)
    expect(layer.isActive()).toBe(true)
  })
  
  it('provides correct effects', () => {
    const context = createTestContext({ 
      work: { status: 'working', fatigueLevel: 50 } 
    })
    const layer = new WorkingLayer(context)
    const effects = layer.getEffects()
    
    expect(effects.avatar?.sprite).toBe('working_normal')
    expect(effects.ui?.showPanels).toContain('work-timer')
  })
})
```

#### 2. **統合テスト**
```typescript
describe('ContextManager Integration', () => {
  it('applies multiple layers correctly', () => {
    const manager = new ContextManager(initialContext)
    manager.updateContext({ 
      work: { status: 'working', fatigueLevel: 85 },
      permission: { isDevMode: true }
    })
    
    const effects = manager.getActiveEffects()
    expect(effects.avatar?.sprite).toBe('working_exhausted') // HighFatigueLayer wins
    expect(effects.ui?.showPanels).toContain('dev-panel') // DevModeLayer
  })
})
```

### ドキュメント保守

#### 1. **レイヤー仕様書**
各レイヤーについて以下を文書化：
- アクティブ化条件
- 提供するエフェクト
- 他レイヤーとの相互作用
- パフォーマンス特性

#### 2. **コンテキスト設計ガイド**
- 新しいコンテキストの追加方法
- レイヤー優先度の決定指針
- エフェクト競合の解決パターン

## 🎯 結論

### COP導入の推奨度: ⭐⭐⭐⭐☆

#### 推奨理由
1. **既存システムとの親和性**: 現在の動的コンテキストシステムとの概念的整合性
2. **保守性向上**: 機能の分離と宣言的な定義による理解しやすさ
3. **拡張性**: 新機能追加時の影響範囲の限定
4. **テスタビリティ**: レイヤー単位での独立したテスト

#### 注意事項
1. **段階的導入**: 一度に全システムを変更せず、部分的な移行を推奨
2. **チーム教育**: COPパラダイムの理解と習得に時間を要する
3. **パフォーマンス監視**: 動的評価のオーバーヘッドに注意

### 次のステップ

1. **チーム内での討議**: COP導入の是非とスケジュール検討
2. **プロトタイプ実装**: Phase 1の範囲でのPoC作成
3. **パフォーマンス評価**: 既存システムとの性能比較
4. **段階的移行計画**: 具体的なマイルストーンの策定

---

**作成日**: 2025-06-25  
**更新者**: Claude Code Assistant  
**ステータス**: 検討中