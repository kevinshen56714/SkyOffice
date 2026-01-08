# SkyOfficeC - 動的コンテキストシステム

## 概要

このドキュメントは、SkyOfficeCのアプリケーション実行時に動的に変化する処理とコンテキストベースの機能をまとめています。

## 🏗️ System Architecture Overview (システムアーキテクチャ概要)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           SkyOfficeC アーキテクチャ                               │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                                🎨 UI層（表示層）                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                 │
│  │  DevModePanel   │  │ WorkStatusPanel │  │  MeetingRoom    │                 │
│  │ /components/    │  │   (Future)      │  │     Chat        │                 │
│  │ DevModePanel.   │  │                 │  │ /components/    │                 │
│  │ tsx:50+         │  │                 │  │ MeetingRoom     │                 │
│  └─────────────────┘  └─────────────────┘  │ Chat.tsx        │                 │
│           │                      │         └─────────────────┘                 │
│           ▼                      ▼                   │                         │
└───────────┼──────────────────────┼───────────────────┼─────────────────────────┘
            │                      │                   │
┌───────────┼──────────────────────┼───────────────────┼─────────────────────────┐
│           ▼         📊 Store層（状態管理層）                   ▼                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                 │
│  │   DevModeStore  │  │   WorkStore     │  │ MeetingRoomStore│                 │
│  │ /stores/        │  │ /stores/        │  │ /stores/        │                 │
│  │ DevModeStore.   │  │ WorkStore.ts    │  │ MeetingRoom     │                 │
│  │ ts:4-25         │  │ :42-186         │  │ Store.ts:71-137 │                 │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                 │
│           │                      │                   │                         │
│           └──────────┬───────────┼───────────────────┘                         │
└──────────────────────┼───────────┼─────────────────────────────────────────────┘
                       │           │
┌──────────────────────┼───────────┼─────────────────────────────────────────────┐
│           ┌──────────▼───────────▼──────────┐   🎯 型層                 │
│           │      AvatarTypes.ts             │                                 │
│           │    /types/AvatarTypes.ts        │                                 │
│           │   getFatigueCategory():29-35    │                                 │
│           │   getAvatarSprite():15-27       │                                 │
│           │   AVATAR_MAPPING:37-85          │                                 │
│           └─────────────────────────────────┘                                 │
└───────────────────────┼─────────────────────────────────────────────────────────┘
                        │
┌───────────────────────┼─────────────────────────────────────────────────────────┐
│                       ▼            🎮 ゲーム層                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                 │
│  │     Game.ts     │  │   MyPlayer.ts   │  │ MeetingRoom     │                 │
│  │   /scenes/      │  │  /characters/   │  │ Manager.ts      │                 │
│  │ Game.ts:        │  │ MyPlayer.ts     │  │ /scenes/        │                 │
│  │ 41,464-481,     │  │ updateAvatar    │  │ MeetingRoom.ts  │                 │
│  │ 485-602         │  │ FromWorkState() │  │                 │                 │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                 │
│           │                      │                   │                         │
│           ▼                      ▼                   ▼                         │
│  ┌─────────────────────────────────────────────────────────────┐               │
│  │                DOM イベントシステム                             │               │
│  │         document.addEventListener('mousemove')              │               │
│  │         document.addEventListener('mouseup')                │               │
│  │              Canvas マウスイベント                            │               │
│  └─────────────────────────────────────────────────────────────┘               │
└───────────────────────┼─────────────────────────────────────────────────────────┘
                        │
┌───────────────────────┼─────────────────────────────────────────────────────────┐
│                       ▼         🌐 ネットワーク層                               │
│  ┌─────────────────────────────────────────────────────────────┐               │
│  │                    Network.ts                               │               │
│  │               /services/Network.ts                          │               │
│  │         updateOtherPlayerWorkStatus()                       │               │
│  │         updateMeetingRoom():97-99                           │               │
│  │              Colyseus WebSocket通信                             │               │
│  └─────────────────────────────────────────────────────────────┘               │
│                                │                                               │
└────────────────────────────────┼───────────────────────────────────────────────┘
                                 │
┌────────────────────────────────┼───────────────────────────────────────────────┐
│                                ▼      🌍 グローバル通信層            │
│  ┌─────────────────────────────────────────────────────────────┐               │
│  │              window.devModeUpdateRoomArea                   │               │
│  │           層間横断グローバル関数                      │               │
│  │        ゲーム層 ←→ UI層 通信                 │               │
│  └─────────────────────────────────────────────────────────────┘               │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                         🔄 データフローパターン                                  │
└─────────────────────────────────────────────────────────────────────────────────┘

ユーザーアクション → UI層 → Store層 → ゲーム層 → ネットワーク層
     ▲                                      │            │
     │                                      ▼            ▼
     └── 視覚フィードバック ←── 型層 ←── ゲーム状態 ←── サーバー状態

動的処理トリガー:
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ 勤務状態        │───▶│ 疲労度          │───▶│ アバター変更    │
│ 変更            │    │ 計算            │    │ (全層)          │
└─────────────────┘    └─────────────────┘    └─────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ 会議室モード    │───▶│ 権限            │───▶│ アクセス制御    │
│ 変更            │    │ 検証            │    │ (ネット+ゲーム) │
└─────────────────┘    └─────────────────┘    └─────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ DevMode切り替え │───▶│ 編集モード      │───▶│ ビジュアル      │
│                 │    │ 有効化          │    │ エディタ(G+D)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 🔧 層別責任 (Layer Responsibilities)

| 層                 | 主要責任                                                  | キーファイル                                       | 動的処理の役割                         |
| ------------------ | --------------------------------------------------------- | -------------------------------------------------- | -------------------------------------- |
| **UI層**           | Reactコンポーネントレンダリング、ユーザーインターフェース | DevModePanel.tsx, Chat.tsx                         | 状態表示、ユーザー入力処理             |
| **Store層**        | Redux状態管理、ビジネスロジック                           | WorkStore.ts, MeetingRoomStore.ts, DevModeStore.ts | 状態統合、アクションディスパッチ       |
| **型層**           | 型定義、純粋ロジック関数                                  | AvatarTypes.ts                                     | アバターマッピング、疲労度計算         |
| **ゲーム層**       | Phaserゲームエンジン、視覚表現                            | Game.ts, MyPlayer.ts, MeetingRoomManager.ts        | 視覚更新、インタラクティブコントロール |
| **ネットワーク層** | リアルタイム通信、サーバー同期                            | Network.ts                                         | マルチユーザー同期                     |
| **グローバル層**   | 層間横断通信                                              | windowオブジェクト                                 | 層ブリッジ関数                         |

### 🔀 動的処理フロー (Dynamic Processing Flow)

````
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    5つの動的処理システム                              │
└─────────────────────────────────────────────────────────────────────────────────┘

1. 勤務状態動的処理:
   UI層 → Store層 → 型層 → ゲーム層 → ネットワーク層

2. 疲労度動的処理:
   Store層 → 型層 → ゲーム層 → UI層

3. 会議室権限動的処理:
   UI層 → Store層 → ネットワーク層 → ゲーム層

   実際のコード処理フロー:
   ```typescript
   // UI層: DevModePanel.tsx:465-487
   const updateRoomMode = (roomId: string, newMode: MeetingRoomMode) => {
     dispatch(updateMeetingRoom({ room: { ...room, mode: newMode }, area }))
   }

   // Store層: MeetingRoomStore.ts:71-113
   updateMeetingRoom: (state, action) => {
     state.meetingRooms[roomIndex] = action.payload.room  // 権限情報更新
     game.network.updateMeetingRoom({
       mode: action.payload.room.mode  // ネットワーク層へ伝播
     })
   }

   // Network層: Network.ts
   updateMeetingRoom(roomData) {
     this.room?.send(Message.UPDATE_MEETING_ROOM, roomData)  // サーバー送信
   }

   // Game層: MeetingRoom.ts:229-241
   private canAccessMeetingRoom(room: MeetingRoom): boolean {
     if (room.mode === 'private') {
       return room.invitedUsers.includes(myUserId)  // 物理制限適用
     }
     return room.mode === 'open'
   }
````

4. ビジュアル編集モード動的処理:
   UI層 → ゲーム層 → DOMイベント → Store層
5. DevMode動的処理:
   UI層 → Store層 → ゲーム層 → グローバル層

````

## 🎯 Five Core Dynamic Processing Systems (5つの主要動的処理システム)

現在のシステムには以下の5つの動的処理が実装されています：

### 1. 🏃‍♂️ Work Status Dynamic Processing (労働状態動的処理)

**概要**: ユーザーの労働状態変化に基づくリアルタイム処理
**実装場所**: `WorkStore.ts`, `Game.ts`, `MyPlayer.ts`

**切り替え条件**:
```typescript
// 状態変更の前提条件とコード条件式

// 📍 /src/stores/WorkStore.ts:42-47 (startWork)
- working状態への切り替え:
  if (workState.workStatus === 'off-duty' || workState.workStatus === 'break') {
    // startWork() 実行可能
    state.workStatus = 'working'
    state.workStartTime = Date.now()
  }

// 📍 /src/stores/WorkStore.ts:74-82 (startBreak)
- break状態への切り替え:
  if (workState.workStatus === 'working' &&
      workState.workStartTime &&
      Date.now() - workState.workStartTime >= MIN_WORK_DURATION) {
    // startBreak() 実行可能
    state.workStatus = 'break'
  }

// 📍 /src/stores/WorkStore.ts:101-109 (updateWorkStatus)
- meeting状態への切り替え:
  if (roomState.joinedRoomData?.roomId || manualMeetingSet) {
    // updateWorkStatus('meeting') 実行可能
    state.workStatus = action.payload.status
  }

// 📍 /src/stores/WorkStore.ts:101-109 (updateWorkStatus)
- overtime状態への切り替え:
  if (workState.workStatus === 'working' &&
      Date.now() >= STANDARD_WORK_END_TIME) {
    // updateWorkStatus('overtime') 実行可能
    state.workStatus = action.payload.status
  }

// 📍 /src/stores/WorkStore.ts:59-67 (endWork)
- off-duty状態への切り替え:
  if (workState.workStatus !== 'off-duty' && (userLogout || workEndRequest)) {
    // endWork() 実行可能
    state.workStatus = 'off-duty'
    state.workStartTime = null
  }

// 使用している状態・変数
- workState.workStatus: WorkStatus ('working' | 'break' | 'meeting' | 'overtime' | 'off-duty')
- workState.workStartTime: number | null
- roomState.joinedRoomData: IJoinedRoomData | null (/src/stores/RoomStore.ts)
- Date.now(): 現在時刻
- MIN_WORK_DURATION, STANDARD_WORK_END_TIME: 設定値
````

**動的処理内容**:

```typescript
// 労働状態変更による実行・変化処理

// 📍 [Store層] /src/stores/WorkStore.ts:52-57 (startWork時のアバター更新)
1. アバタースプライト自動切り替え:
   state.currentAvatarSprite = getAvatarSprite(
     state.baseAvatar,
     state.workStatus,
     state.fatigueLevel
   )

// 📍 [Game層] /src/characters/MyPlayer.ts (updateAvatarFromWorkState)
2. Phaserスプライト更新:
   updateAvatarFromWorkState() {
     const workState = store.getState().work
     const newSprite = getAvatarSprite(...)
     this.setTexture(newSprite)
   }

// 📍 [Network層] /src/services/Network.ts (updateOtherPlayerWorkStatus)
3. ネットワーク同期ブロードキャスト:
   updateOtherPlayerWorkStatus(sessionId: string, workData: any) {
     // Colyseusを通じて他プレイヤーに状態同期
   }

// 📍 [Store層] /src/stores/WorkStore.ts:44-46 (workStartTime設定)
4. 時間計測開始/停止:
   state.workStartTime = Date.now() // startWork時
   state.workStartTime = null       // endWork時

// 📍 [UI層] /src/components/DevModePanel.tsx:52+ (useAppSelector)
5. DevModePanelリアルタイム表示更新:
   const workState = useAppSelector((state) => state.work)
   // workState変更で自動再レンダリング

// 📍 [UI層] /src/components/WorkStatusPanel.tsx (将来実装)
6. WorkStatusPanel UI更新:
   // 労働状態表示アイコン・時間表示の動的更新

**処理の層別分散**:
- **Store層**: Redux状態管理とアバタースプライト計算
- **Game層**: Phaserゲーム内ビジュアル更新
- **Network層**: マルチプレイヤー同期
- **UI層**: React UI コンポーネント更新
```

### 2. 😴 Fatigue Level Dynamic Processing (疲労度動的処理)

**概要**: 疲労度レベル(0-100%)に基づく段階的視覚変化処理
**実装場所**: `AvatarTypes.ts`, `WorkStore.ts`

**切り替え条件**:

```typescript
// 疲労度変更の条件とコード条件式

// 📍 /src/stores/WorkStore.ts:180-186 (setFatigueLevel)
- 疲労度設定:
  setFatigueLevel: (state, action: PayloadAction<number>) => {
    state.fatigueLevel = Math.max(0, Math.min(100, action.payload))
    state.currentAvatarSprite = getAvatarSprite(
      state.baseAvatar, state.workStatus, state.fatigueLevel
    )
  }

// 📍 /src/types/AvatarTypes.ts:15-27 (getAvatarSprite)
- アバター選択ロジック:
  export const getAvatarSprite = (
    baseAvatar: BaseAvatarType,
    workStatus: WorkStatus,
    fatigueLevel: number
  ): string => {
    const fatigueCategory = getFatigueCategory(fatigueLevel)
    return AVATAR_MAPPING[baseAvatar][workStatus][fatigueCategory]
  }

// 📍 /src/types/AvatarTypes.ts:29-35 (getFatigueCategory)
- 疲労度段階判定:
  const getFatigueCategory = (fatigueLevel: number): FatigueCategory => {
    if (fatigueLevel <= 30) return 'low'
    if (fatigueLevel <= 70) return 'medium'
    return 'high'
  }

// 📍 /src/components/DevModePanel.tsx:169-174 (手動疲労度調整)
- DevMode手動調整:
  const handleSetFatigue = () => {
    if (mockFatigueLevel >= 0 && mockFatigueLevel <= 100) {
      dispatch(setFatigueLevel(mockFatigueLevel))
    }
  }

// 📍 /src/stores/WorkStore.ts:42-57, 74-86 (自動疲労度変化 - 将来実装)
- 作業時間による自動増加:
  if (workState.workStatus === 'working') {
    const workDuration = Date.now() - workState.workStartTime
    const fatigueIncrease = Math.min(100, workDuration / FATIGUE_RATE)
    // 定期的なsetFatigueLevel(currentFatigue + fatigueIncrease)
  }

// 使用している状態・変数
- workState.workStatus: WorkStatus (/src/stores/WorkStore.ts:21)
- workState.workStartTime: number | null (/src/stores/WorkStore.ts:22)
- workState.fatigueLevel: number (0-100) (/src/stores/WorkStore.ts:25)
- workState.baseAvatar: BaseAvatarType (/src/stores/WorkStore.ts:23)
- workState.currentAvatarSprite: string (/src/stores/WorkStore.ts:24)
- devModeState.isDevMode: boolean (/src/stores/DevModeStore.ts)
- AVATAR_MAPPING: 疲労度別アバターマッピング (/src/types/AvatarTypes.ts:37)
```

**動的処理内容**:

```typescript
// 疲労度変更による実行・変化処理

// 📍 [Type層] /src/types/AvatarTypes.ts:29-35 (getFatigueCategory)
1. 疲労度段階判定:
   const getFatigueCategory = (fatigueLevel: number): FatigueCategory => {
     if (fatigueLevel <= 30) return 'low'    // 通常状態
     if (fatigueLevel <= 70) return 'medium' // 疲労状態
     return 'high'                           // 重疲労状態
   }

// 📍 [Store層] /src/stores/WorkStore.ts:182-186 (setFatigueLevel)
2. アバタースプライト自動更新:
   state.fatigueLevel = Math.max(0, Math.min(100, action.payload))
   state.currentAvatarSprite = getAvatarSprite(
     state.baseAvatar, state.workStatus, state.fatigueLevel
   )

// 📍 [Type層] /src/types/AvatarTypes.ts:37-85 (AVATAR_MAPPING)
3. 疲労度別アバター選択:
   AVATAR_MAPPING[baseAvatar][workStatus][fatigueCategory]
   // 例: 'adam_working_tired', 'lucy_break_exhausted'

// 📍 [Game層] /src/characters/MyPlayer.ts (updateAvatarFromWorkState)
4. Phaserスプライト動的更新:
   updateAvatarFromWorkState() {
     const workState = store.getState().work
     const newSprite = getAvatarSprite(
       workState.baseAvatar, workState.workStatus, workState.fatigueLevel
     )
     this.setTexture(newSprite)
   }

// 📍 [UI層] /src/components/DevModePanel.tsx:125+ (疲労度表示)
5. DevMode疲労度インジケーター:
   <Typography>Fatigue: {workState.fatigueLevel}%</Typography>
   // リアルタイム疲労度表示更新

// 📍 [Network層] /src/services/Network.ts (updateOtherPlayerWorkStatus)
6. 他プレイヤーへの疲労状態同期:
   updateOtherPlayerWorkStatus(sessionId, {
     workStatus: state.workStatus,
     fatigueLevel: state.fatigueLevel,
     currentAvatarSprite: state.currentAvatarSprite
   })

// 📍 [Game層] /src/characters/OtherPlayer.ts (将来実装)
7. 他プレイヤー疲労状態表示:
   // 疲労度に基づく他プレイヤーアバター表示

**処理の層別分散**:
- **Type層**: 疲労度分類ロジックとアバターマッピング
- **Store層**: Redux疲労度状態管理とスプライト計算
- **Game層**: Phaserゲーム内疲労度ビジュアル表現
- **UI層**: React疲労度インジケーター表示
- **Network層**: マルチプレイヤー疲労状態同期
```

### 3. 🏢 Meeting Room Permission Dynamic Processing (会議室権限動的処理)

**概要**: 会議室のアクセス権限とモードに基づく動的アクセス制御
**実装場所**: `MeetingRoomStore.ts`, `Network.ts`

**切り替え条件**:

```typescript
// 権限モード変更の条件とコード条件式

// 📍 /src/stores/MeetingRoomStore.ts:71-80 (updateMeetingRoom)
- 会議室モード更新:
  updateMeetingRoom: (
    state,
    action: PayloadAction<{
      roomId: string;
      updates: Partial<Omit<MeetingRoom, 'id'>>
    }>
  ) => {
    const room = state.meetingRooms.find(r => r.id === action.payload.roomId)
    if (room) {
      Object.assign(room, action.payload.updates)
    }
  }

// 📍 /src/stores/MeetingRoomStore.ts:5 (MeetingRoomMode定義)
- 権限モード定義:
  export type MeetingRoomMode = 'open' | 'private' | 'secret'

// 📍 /src/components/DevModePanel.tsx:989-995 (DevMode権限チェック)
- DevMode経由のモード変更:
  if (userState.sessionId === room.creatorId ||
      userState.permissions.includes('admin') ||
      devModeState.isDevMode) {
    // updateMeetingRoom({ mode: 'open'/'private'/'secret' }) 実行可能
  }

// 📍 Network.ts (将来実装 - アクセス権限判定)
- アクセス権限判定条件:
  const canEnterRoom = (room: MeetingRoom, userId: string) => {
    switch (room.mode) {
      case 'open':
        return true
      case 'private':
        return room.allowedUsers?.includes(userId) || false
      case 'secret':
        return room.allowedUsers?.includes(userId) || room.creatorId === userId
      default:
        return false
    }
  }

// 📍 /src/stores/MeetingRoomStore.ts:10-14 (MeetingRoom interface)
- 会議室表示判定:
  interface MeetingRoom {
    id: string
    name: string
    mode: MeetingRoomMode
    allowedUsers?: string[]
    creatorId: string
  }

// 使用している状態・変数
- userState.sessionId: string (現在のユーザーID)
- userState.permissions: string[] (ユーザー権限配列)
- room.creatorId: string (/src/stores/MeetingRoomStore.ts:14)
- room.mode: MeetingRoomMode (/src/stores/MeetingRoomStore.ts:12)
- room.allowedUsers: string[] | undefined (/src/stores/MeetingRoomStore.ts:13)
- devModeState.isDevMode: boolean (/src/stores/DevModeStore.ts:4)
```

**動的処理内容**:

```typescript
// 会議室権限変更による実行・変化処理

// 📍 [Store層] /src/stores/MeetingRoomStore.ts:71-80 (updateMeetingRoom)
1. 会議室状態更新:
   const room = state.meetingRooms.find(r => r.id === action.payload.roomId)
   if (room) {
     Object.assign(room, action.payload.updates)
     // mode, allowedUsers, name等の動的更新
   }

// 📍 [Network層] /src/services/Network.ts:97-99 (ネットワーク同期)
2. リアルタイム権限同期:
   game.network.updateMeetingRoom({
     roomId: action.payload.roomId,
     ...action.payload.updates
   })

// 📍 [Game層] /src/scenes/MeetingRoom.ts (アクセス制御)
3. 入室権限チェック:
   const canEnterRoom = (room: MeetingRoom, userId: string) => {
     switch (room.mode) {
       case 'open': return true
       case 'private': return room.allowedUsers?.includes(userId)
       case 'secret': return room.allowedUsers?.includes(userId) || room.creatorId === userId
     }
   }

// 📍 [UI層] /src/components/RoomList.tsx (将来実装)
4. 会議室リスト動的表示:
   const visibleRooms = meetingRooms.filter(room => {
     if (room.mode === 'secret') {
       return room.creatorId === currentUserId || room.allowedUsers?.includes(currentUserId)
     }
     return true
   })

// 📍 [UI層] /src/components/DevModePanel.tsx:989-995 (DevMode権限制御UI)
5. DevMode権限管理UI:
   <Select value={room.mode} onChange={(e) => updateRoomMode(room.id, e.target.value)}>
     <MenuItem value="open">Open</MenuItem>
     <MenuItem value="private">Private</MenuItem>
     <MenuItem value="secret">Secret</MenuItem>
   </Select>

// 📍 [Game層] /src/scenes/MeetingRoom.ts (占有状況管理)
6. 占有状況リアルタイム更新:
   room.onStateChange((state) => {
     // currentUsers配列の動的更新
     // 入退室時の権限再チェック
   })

// 📍 [Network層] /src/services/Network.ts (権限違反検出)
7. 権限違反時の自動退室:
   if (!canEnterRoom(room, sessionId)) {
     // 自動的にロビーに移動
     this.leaveRoom()
   }

**処理の層別分散**:
- **Store層**: Redux会議室権限状態管理
- **Network層**: Colyseus権限同期と違反検出
- **Game層**: Phaser入退室制御と権限チェック
- **UI層**: React権限管理インターフェース
```

### 4. ✏️ Visual Edit Mode Dynamic Processing (編集モード動的処理)

**概要**: 会議室視覚編集モードのオン/オフに基づくインタラクション変化
**実装場所**: `Game.ts`, `DevModePanel.tsx`

**切り替え条件**:

```typescript
// 編集モード有効化の条件とコード条件式

// 📍 /src/scenes/Game.ts:464-481 (toggleMeetingRoomEditMode)
- 編集モード切り替え:
  toggleMeetingRoomEditMode(enabled: boolean) {
    console.log('🎯 [Game] toggleMeetingRoomEditMode called with:', enabled)
    this.meetingRoomEditMode = enabled

    if (enabled) {
      this.meetingRoomManager.hideRoomAreas()
      this.createEditableRoomAreas()
    } else {
      this.clearEditableRoomAreas()
      this.meetingRoomManager.showRoomAreas()
    }
  }

// 📍 /src/scenes/Game.ts:41 (meetingRoomEditMode変数)
- 編集モード状態管理:
  private meetingRoomEditMode = false

// 📍 /src/scenes/Game.ts:485-530 (setupRoomDragSystem)
- DOM-basedドラッグシステム:
  private setupRoomDragSystem(roomRect: Phaser.GameObjects.Rectangle, roomId: string) {
    const roomDragState = {
      isDragging: false,
      startMouseX: 0,
      startMouseY: 0,
      startObjX: 0,
      startObjY: 0,
      roomId: roomId
    }

    roomRect.on('pointerdown', (pointer: any) => {
      if (this.meetingRoomEditMode && !roomDragState.isDragging) {
        // ドラッグ開始処理
      }
    })
  }

// 📍 /src/scenes/Game.ts:574-602 (updateRoomPositionInStore)
- Redux位置更新:
  private updateRoomPositionInStore(roomId: string, centerX: number, centerY: number) {
    const meetingRoomState = store.getState().meetingRoom
    const area = meetingRoomState.meetingRoomAreas.find(a => a.meetingRoomId === roomId)

    if (area) {
      const updateFunction = (window as any).devModeUpdateRoomArea
      if (updateFunction) {
        updateFunction(roomId, { x: newX, y: newY, width: area.width, height: area.height })
      }
    }
  }

// 📍 /src/components/DevModePanel.tsx:120-130 (devModeUpdateRoomArea)
- DevMode経由の更新関数:
  const updateRoomAreaFromVisual = (roomId: string, newArea: any) => {
    const currentArea = meetingRoomState.meetingRoomAreas.find(a => a.meetingRoomId === roomId)
    if (currentArea) {
      dispatch(updateMeetingRoomArea({ ...currentArea, ...newArea }))
    }
  }

// 使用している状態・変数
- this.meetingRoomEditMode: boolean (/src/scenes/Game.ts:41)
- devModeState.isDevMode: boolean (/src/stores/DevModeStore.ts:4)
- this.game.canvas: HTMLCanvasElement (/src/scenes/Game.ts:521)
- roomDragState.isDragging: boolean (/src/scenes/Game.ts:488)
- meetingRoomState.meetingRoomAreas: MeetingRoomArea[] (/src/stores/MeetingRoomStore.ts)
- store.getState(): RootState (/src/stores/index.ts)
- (window as any).devModeUpdateRoomArea: function (/src/components/DevModePanel.tsx:125)
```

**動的処理内容**:

```typescript
// 編集モード切り替えによる実行・変化処理

// 📍 [Game層] /src/scenes/Game.ts:468-473 (編集モード有効化処理)
1. 編集可能オブジェクト表示:
   if (enabled) {
     this.meetingRoomManager.hideRoomAreas()      // 既存エリア非表示
     this.createEditableRoomAreas()               // 編集可能エリア作成
   }

// 📍 [Game層] /src/scenes/Game.ts:682-692 (setupRoomDragSystem呼び出し)
2. DOM-basedドラッグシステム有効化:
   this.setupRoomDragSystem(rect, roomId)
   // document.addEventListener('mousemove', roomMouseMoveHandler)
   // document.addEventListener('mouseup', roomMouseUpHandler)

// 📍 [Game層] /src/scenes/Game.ts:642-653 (ホバー効果)
3. 視覚的フィードバック制御:
   rect.on('pointerover', () => {
     if (!rect.getData('isDragging')) {
       rect.setFillStyle(0xff9800, 0.5)  // ホバー時透明度変更
     }
   })

// 📍 [Game層] /src/scenes/MeetingRoomManager.ts (showRoomAreas/hideRoomAreas)
4. 既存MeetingRoomManager表示制御:
   hideRoomAreas() // 編集開始時
   showRoomAreas() // 編集終了時

// 📍 [Store層] /src/stores/MeetingRoomStore.ts:128-137 (updateMeetingRoomArea)
5. Redux位置データリアルタイム更新:
   updateMeetingRoomArea: (state, action: PayloadAction<MeetingRoomArea>) => {
     const index = state.meetingRoomAreas.findIndex(area =>
       area.meetingRoomId === action.payload.meetingRoomId
     )
     if (index !== -1) {
       state.meetingRoomAreas[index] = action.payload
     }
   }

// 📍 [UI層] /src/components/DevModePanel.tsx:125-130 (グローバル関数設定)
6. DevMode更新関数グローバル登録:
   (window as any).devModeUpdateRoomArea = updateRoomAreaFromVisual
   // ドラッグ終了時にGame.tsから呼び出し可能

// 📍 [Game層] /src/scenes/Game.ts:705-712 (DOM イベントクリーンアップ)
7. イベントリスナー管理:
   // 編集モード終了時の自動クリーンアップ
   document.removeEventListener('mousemove', roomMouseMoveHandler)
   document.removeEventListener('mouseup', roomMouseUpHandler)

**処理の層別分散**:
- **Game層**: Phaser編集モード制御、ドラッグシステム、ビジュアル管理
- **Store層**: Redux会議室エリア位置状態管理
- **UI層**: DevMode編集インターフェースとグローバル関数
- **DOM層**: ブラウザマウスイベント直接制御
```

### 5. 🛠️ DevMode Dynamic Processing (DevMode動的処理)

**概要**: 開発モード状態に基づく包括的デバッグ機能の動的制御
**実装場所**: `DevModePanel.tsx`, `DevModeStore.ts`

**切り替え条件**:

```typescript
// DevMode有効化の条件とコード条件式

// 📍 /src/stores/DevModeStore.ts:19-25 (setDevmode)
- DevMode状態切り替え:
  setDevmode: (state, action) => {
    const previousState = state.isDevMode
    state.isDevMode = action.payload
    if (previousState !== state.isDevMode) {
      console.log(`🛠️ [DevMode] ${state.isDevMode ? 'ENABLED' : 'DISABLED'}`)
    }
  }

// 📍 /src/stores/DevModeStore.ts:4-8 (DevModeState interface)
- DevMode状態定義:
  interface DevModeState {
    isDevMode: boolean
  }
  const initialState: DevModeState = {
    isDevMode: false,
  }

// 📍 /src/components/DevModePanel.tsx:50 (DevModePanel component)
- DevModePanel表示制御:
  const DevModePanel: React.FC = () => {
    const isDevMode = useAppSelector((state) => state.devMode.isDevMode)
    // Hook declarations...

    if (!isDevMode) {
      return (
        <Button onClick={() => dispatch(setDevmode(true))}>
          🛠️ Enable DevMode
        </Button>
      )
    }
    // 7タブパネル表示
  }

// 📍 /src/components/DevModePanel.tsx:138 (DevMode有効化ボタン)
- DevMode有効化トリガー:
  <Button
    onClick={() => dispatch(setDevmode(true))}
    sx={{ position: 'fixed', top: 20, right: 20, zIndex: 9999 }}
  >
    🛠️ Enable DevMode
  </Button>

// 📍 /src/components/DevModePanel.tsx:658-665 (DevMode無効化)
- DevMode無効化ボタン:
  <Button
    size="small"
    onClick={() => dispatch(setDevmode(false))}
    sx={{ fontSize: '8px', minWidth: '30px' }}
  >
    ❌
  </Button>

// 📍 環境変数ベースの制御 (将来実装)
- 環境制限:
  const canEnableDevMode = () => {
    return process.env.NODE_ENV === 'development' ||
           process.env.REACT_APP_ENABLE_DEVMODE === 'true'
  }

// 使用している状態・変数
- state.devMode.isDevMode: boolean (/src/stores/DevModeStore.ts:4)
- useAppSelector((state) => state.devMode.isDevMode) (/src/components/DevModePanel.tsx:52)
- dispatch(setDevmode(boolean)) (/src/components/DevModePanel.tsx:138, 665)
- process.env.NODE_ENV: string (環境変数)
- process.env.REACT_APP_ENABLE_DEVMODE: string (環境変数)
- tabValue: number (/src/components/DevModePanel.tsx:54)
- localStorage.getItem('devmode_enabled'): string | null (将来実装)
```

**動的処理内容**:

```typescript
// DevMode切り替えによる実行・変化処理

// 📍 [UI層] /src/components/DevModePanel.tsx:132-149 (DevMode有効時)
1. 7タブDevModePanelの表示:
   if (!isDevMode) {
     return <Button onClick={() => dispatch(setDevmode(true))}>Enable DevMode</Button>
   }
   // 7タブパネル表示: Work, User, Room, Chat, Features, Mock, Logs

// 📍 [UI層] /src/components/DevModePanel.tsx:1658+ (Logsタブ)
2. リアルタイムログ監視システム:
   const logs = useAppSelector((state) => state.logger.logs)
   const filteredLogs = logs.filter(log => {
     if (logFilter !== 'all' && log.level !== logFilter) return false
     if (componentFilter !== 'all' && log.component !== componentFilter) return false
     return true
   })

// 📍 [UI層] /src/components/DevModePanel.tsx:各タブ内容
3. 状態操作インターフェース提供:
   // Work Tab: 労働状態・疲労度・アバター変更
   // User Tab: 背景モード・ログイン状態制御
   // Room Tab: 会議室管理・Visual Editor
   // Chat Tab: チャット機能テスト

// 📍 [UI層] /src/components/DevModePanel.tsx:1520-1580 (Mock Tab)
4. モックデータ生成・テストシナリオ:
   const handleFullWorkDay = () => {
     dispatch(startWork())
     dispatch(setFatigueLevel(80))
     // 一括テストシナリオ実行
   }

// 📍 [Store層] /src/stores/DevModeStore.ts:19-25 (状態変更ログ)
5. デバッグ情報ロギング:
   setDevmode: (state, action) => {
     const previousState = state.isDevMode
     state.isDevMode = action.payload
     if (previousState !== state.isDevMode) {
       console.log(`🛠️ [DevMode] ${state.isDevMode ? 'ENABLED' : 'DISABLED'}`)
     }
   }

// 📍 [Game層] /src/scenes/Game.ts:464+ (Visual Editor有効化)
6. Visual Editor機能統合:
   if (devModeState.isDevMode) {
     // toggleMeetingRoomEditMode() 使用可能
     // 会議室エリアドラッグ編集有効化
   }

// 📍 [Network層] /src/services/Network.ts (デバッグ情報)
7. ネットワークデバッグ情報表示:
   if (devModeState.isDevMode) {
     // 詳細なネットワーク同期ログ
     // 接続状態・エラー情報表示
   }

// 📍 [UI層] /src/components/DevModePanel.tsx:120-130 (グローバル関数設定)
8. グローバルデバッグ関数提供:
   (window as any).devModeUpdateRoomArea = updateRoomAreaFromVisual
   // Game層からのダイレクト呼び出し可能

**処理の層別分散**:
- **UI層**: React DevModePanelインターフェース、7タブ制御、ログ表示
- **Store層**: Redux DevMode状態管理とロギング
- **Game層**: Phaser Visual Editor統合、ゲーム内デバッグ表示
- **Network層**: ネットワーク同期デバッグ情報
- **Global層**: windowオブジェクト経由のクロス層通信
```

## 🔄 Dynamic State-Based Processing (動的状態ベース処理)

### 1. 労働状態による動的変化 (Work Status Dynamic Changes)

#### Avatar Automatic Switching (アバター自動切り替え)

```typescript
// WorkStore.ts - All work status changes trigger avatar updates
const getAvatarSprite = (baseAvatar: BaseAvatarType, workStatus: WorkStatus, fatigueLevel: number): string

// Automatic triggers:
- startWork() → working avatar
- endWork() → off-duty avatar
- startBreak() → break avatar
- updateWorkStatus(meeting) → meeting avatar
- updateWorkStatus(overtime) → overtime avatar
- setFatigueLevel() → fatigue-based visual changes
```

#### Visual Feedback System

```typescript
// Game.ts - MyPlayer avatar updates
updateAvatarFromWorkState() {
  const workState = store.getState().work
  const newSprite = getAvatarSprite(
    workState.baseAvatar,
    workState.workStatus,
    workState.fatigueLevel
  )
  // Real-time sprite switching
}
```

### 2. 会議室権限による動的変化 (Meeting Room Permission Changes)

#### Access Control Dynamic Updates

```typescript
// MeetingRoomStore.ts - Permission-based UI changes
interface MeetingRoom {
  mode: 'open' | 'private' | 'secret'  // Dynamic access control
  allowedUsers?: string[]              // Dynamic user whitelist
  currentUsers: string[]               // Real-time occupancy
}

// Dynamic behaviors:
- mode: 'open' → Anyone can enter
- mode: 'private' → Invitation required
- mode: 'secret' → Hidden from room list
```

#### Real-time Room State Updates

```typescript
// Network.ts - Live permission enforcement
room.onStateChange((state) => {
  // Dynamic room visibility updates
  // Real-time user access control
  // Live occupancy management
})
```

### 3. 疲労度による動的変化 (Fatigue Level Dynamic Changes)

#### Progressive Visual Changes

```typescript
// AvatarTypes.ts - Fatigue-based avatar mapping
const AVATAR_MAPPING = {
  [baseAvatar]: {
    [workStatus]: {
      low: 'normal_sprite', // 0-30% fatigue
      medium: 'tired_sprite', // 31-70% fatigue
      high: 'exhausted_sprite', // 71-100% fatigue
    },
  },
}
```

#### Performance Impact System

```typescript
// Future implementation potential:
- High fatigue → Slower movement speed
- High fatigue → Reduced work efficiency indicators
- High fatigue → Different interaction animations
```

### 4. 通信状態による動的変化 (Communication State Changes)

#### Video/Audio Status Integration

```typescript
// UserStore.ts - Communication state management
interface UserState {
  videoConnected: boolean    // Camera status
  audioConnected: boolean    // Microphone status
  isInCall: boolean         // Active call status
}

// Dynamic visual indicators:
- videoConnected → Camera icon display
- audioConnected → Microphone icon display
- isInCall → Special avatar overlay/badge
```

#### Meeting Room Communication Mode

```typescript
// ChatStore.ts - Context-aware messaging
interface ChatState {
  currentMeetingRoomId: string | null  // Active room context
  showChat: boolean                    // Dynamic chat visibility
  focused: boolean                     // Input focus management
}

// Dynamic behaviors:
- In meeting room → Room-specific chat
- In lobby → Global chat
- Private room → Restricted messaging
```

## 🔄 Context-Aware Processing (コンテキスト対応処理)

### 1. Location-Based Context

#### Lobby vs Meeting Room Context

```typescript
// RoomStore.ts - Location state management
interface RoomState {
  lobbyJoined: boolean
  roomJoined: boolean
  joinedRoomData: IJoinedRoomData | null
}

// Context-dependent features:
- Lobby: Global user list, public chat, room browser
- Meeting Room: Room-specific chat, private user list, room controls
```

#### Spatial Context in Game

```typescript
// Game.ts - Position-based interactions
- Near computer → Computer interaction available
- Near whiteboard → Whiteboard access enabled
- In meeting area → Automatic room association
- Near other players → Direct communication options
```

### 2. Time-Based Context

#### Work Hours Context

```typescript
// WorkStore.ts - Temporal work patterns
interface WorkState {
  workStartTime: number | null    // Session start tracking
  workStatus: WorkStatus          // Current work phase
  fatigueLevel: number           // Accumulated fatigue
}

// Dynamic time-based changes:
- Work duration → Progressive fatigue increase
- Break time → Fatigue recovery
- Overtime hours → Accelerated fatigue accumulation
```

#### Session Context Management

```typescript
// DevModePanel.tsx - Development time context
- Fresh start scenarios
- Full work day simulations
- Stress testing with high fatigue
- Multi-user interaction testing
```

### 3. Permission-Based Context

#### Role-Based Access Control

```typescript
// Future enhancement potential:
interface UserRole {
  type: 'admin' | 'manager' | 'employee' | 'guest'
  permissions: string[]
  meetingRoomAccess: string[]
}

// Dynamic permission enforcement:
- Admin → Full system access, all room management
- Manager → Team room creation, user oversight
- Employee → Standard room access, personal settings
- Guest → Limited access, public areas only
```

## 🎮 Real-time Synchronization (リアルタイム同期)

### データ伝播の全体的な流れ

**現在の実装（問題あり）**:

```
自分のプレイヤー                        他のプレイヤー
┌─────────────────┐                   ┌─────────────────┐
│ UI層: 勤務状態変更│ ────────┐         │                 │
│ ┌─ Redux更新   │          │         │                 │
│ └─ Network送信 │          │         │                 │
└─────────────────┘          │         │                 │
          ↓                  │         │                 │
    ┌──────────────────────────────────────────────────────┐
    │            Colyseus Server                           │
    │         'work-status-changed'                        │
    │        メッセージブロードキャスト                      │
    └──────────────────────────────────────────────────────┘
          ↓                  │         │         ↓
┌─────────────────┐         │         │ ┌─────────────────┐
│Network層:メッセージ受信│       │         │ │Network層:メッセージ受信│
└─────────────────┘         │         │ └─────────────────┘
          ↓                  │         │         ↓
┌─────────────────┐         │         │ ┌─────────────────┐
│Store層:他プレイヤー更新│      │         │ │Store層:他プレイヤー更新│
└─────────────────┘         │         │ └─────────────────┘
          ↓                  │         │         ↓
┌─────────────────┐         │         │ ┌─────────────────┐
│UI層: DevMode表示 │         └─────────│→│UI層: DevMode表示 │
└─────────────────┘                   │ └─────────────────┘
          ↓                            │         ↓
┌─────────────────┐                   │ ┌─────────────────┐
│Game層:自分のアバター│                   │ │Game層:他プレイヤー │
│     外観変更     │                   │ │ アバター外観変更  │
└─────────────────┘                   │ └─────────────────┘
                                      │    (実装予定)
                                      └─────────────────┘
```

**実際のコード例**:

```typescript
// UI層 (WorkStatusPanel.tsx) - 二重処理の問題
const handleStartWork = () => {
  dispatch(startWork()) // ← Redux Store更新
  const game = phaserGame.scene.keys.game as Game
  if (game?.network) {
    game.network.startWork() // ← 直接Network通信
  }
}

// 問題: UI層でRedux更新とNetwork通信を両方実行
```

**理想的なアーキテクチャ**:

```
UI層 → Service層 → [Store層 + Network層] → Server → 他クライアント
```

### 1. マルチプレイヤー状態同期

#### 勤務状態ブロードキャスト

```typescript
// Network.ts - リアルタイム勤務状態更新
updateOtherPlayerWorkStatus(sessionId: string, workData: any) {
  // 他のプレイヤーに勤務状態変更をブロードキャスト
  // リアルタイムで視覚表現を更新
  // クライアント間で疲労度を同期
}
```

#### 会議室状態同期

```typescript
// MeetingRoomManager.ts - ライブルーム更新
- ルーム作成 → 全ユーザーに即座に表示
- 権限変更 → リアルタイムアクセス更新
- ユーザー入退室 → ライブ占有状況追跡
```

### 2. 他プレイヤーデータ表示同期

#### 他プレイヤー勤務状態の伝播フロー

```typescript
// Network.ts:296-326 - サーバーからの勤務状態変更受信
this.room.onMessage('work-status-changed', (data: {
  playerId: string,
  workStatus: string,
  playerName: string
}) => {
  // Redux Storeを更新
  store.dispatch(updateOtherPlayerWorkStatus({
    playerId: data.playerId,
    playerName: data.playerName,
    workStatus: data.workStatus
  }))

  // Phaserイベントも発火（アバター外観変更用）
  phaserEvents.emit('WORK_STATUS_CHANGED', data)
})

// WorkStore.ts - 他プレイヤー状態管理
updateOtherPlayerWorkStatus: (state, action) => {
  const { playerId, playerName, workStatus } = action.payload
  state.otherPlayersWorkStatus[playerId] = {
    playerId,
    playerName,
    workStatus,
    lastUpdated: Date.now()  // 最終更新時刻記録
  }
}

// DevModePanel.tsx:772-786 - UI表示
{Object.entries(workState.otherPlayersWorkStatus).map(([playerId, player]) => (
  <Typography key={playerId}>
    {player.playerName}: {player.workStatus} |
    Updated: {new Date(player.lastUpdated).toLocaleTimeString()}
  </Typography>
))}
```

#### 他プレイヤーアバター外観同期（実装予定）

```typescript
// OtherPlayer.ts - 勤務状態に応じた外観変更（未実装）
updateWorkStatusAppearance(workStatus: WorkStatus, fatigueLevel?: number) {
  const avatarSprite = getAvatarSprite(this.baseAvatar, workStatus, fatigueLevel)
  if (avatarSprite !== this.playerTexture) {
    this.setTexture(avatarSprite)  // スプライト変更
    this.anims.play(`${avatarSprite}_idle_down`, true)
  }
}

// Game.ts - Phaserイベントハンドリング（実装予定）
phaserEvents.on('WORK_STATUS_CHANGED', (data) => {
  const otherPlayer = this.otherPlayerMap.get(data.playerId)
  if (otherPlayer) {
    otherPlayer.updateWorkStatusAppearance(data.workStatus)
  }
})
```

### 3. ビジュアル編集同期

#### リアルタイムルームエディター

```typescript
// Game.ts - ライブ更新付きビジュアルルーム編集
setupRoomDragSystem() {
  // DOMベースドラッグシステム
  // リアルタイム位置更新
  // Reduxストア同期
  // 他ユーザーへのネットワークブロードキャスト
}
```

## 🛠️ 開発コンテキスト機能

### 1. DevMode動的テスト

#### シナリオシミュレーション

```typescript
// DevModePanel.tsx - 動的テストシナリオ
- フルワークデー: 疲労を含む完全な作業サイクルをシミュレート
- フレッシュスタート: 全状態を初期状態にリセット
- 高ストレス: 最大疲労テスト
- マルチユーザー: チームインタラクションをシミュレート
```

#### ライブ状態監視

```typescript
// リアルタイムデバッグ機能:
;-勤務状態追跡 - アバター変更監視 - ネットワーク同期検証 - 会議室状態検査
```

### 2. ビジュアルルームエディターコンテキスト

#### 編集モード状態管理

```typescript
// Game.ts - コンテキスト感知編集
toggleMeetingRoomEditMode(enabled: boolean) {
  if (enabled) {
    // 通常ルームグラフィックを非表示
    // ドラッグインタラクションを有効化
    // 編集専用UIを表示
  } else {
    // 通常ビューを復元
    // 編集インタラクションを無効化
    // 変更をストアに保存
  }
}
```

## 📋 将来の動的コンテキスト拡張

### 1. 高度疲労システム

- 疲労ベースの動的移動速度
- 疲労ベースのインタラクション制限
- 回復率計算
- チーム疲労影響分析

### 2. 強化権限システム

- ロールベースの動的UI変更
- コンテキスト感知機能利用性
- 動的セキュリティ強化
- 権限変更の監査記録

### 3. スマートコンテキスト検出

- 自動会議検出
- 作業パターン分析
- 予測的疲労管理
- インテリジェントルーム推奨

### 4. コミュニケーションコンテキスト

- ステータスベースの利用可能性表示
- コンテキスト感知通知フィルタリング
- 会議固有コミュニケーションモード
- 動的プライバシーコントロール

## 🔧 実装ノート

### 状態管理アーキテクチャ

- 中央集中状態管理のRedux Toolkit
- Colyseus経由のリアルタイム同期
- UI更新用コンテキスト感知セレクター
- 自動状態永続化

### パフォーマンス考慮事項

- React.memoでの効率的再レンダリング
- 選択的状態購読
- デバウンスされたリアルタイム更新
- 適切なクリーンアップでのメモリリーク防止

### エラーハンドリング

- ネットワーク問題のグレースフルデグラデーション
- 状態回復メカニズム
- コンテキスト検証とフォールバック
- ユーザーフレンドリーなエラーメッセージ

---

このコンテキストシステムにより、SkyOfficeCは**動的で応答性の高い仮想オフィス環境**を提供し、ユーザーの作業状態、権限、疲労度、コミュニケーション状況に基づいて**リアルタイムで適応**します。
