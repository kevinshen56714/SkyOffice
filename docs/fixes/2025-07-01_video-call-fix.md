# ビデオ通話機能修正レポート

**日付:** 2025-07-01  
**対象機能:** プレイヤー間ビデオ通話システム  
**修正結果:** ✅ 完全解決

## 📋 問題の概要

### **症状**
- プレイヤー同士が近づいてもビデオ通話が開始されない
- `otherVideoConnected: false` の状態が続く
- `makeCall` 条件が満たされない

### **エラーログ例**
```
🎥 [OtherPlayer] makeCall conditions: {
  connected: false, 
  bufferTime: 37494.35333363589, 
  myReadyToConnect: true, 
  otherReadyToConnect: true, 
  myVideoConnected: true, 
  otherVideoConnected: false  ← 問題
}
🎥 [OtherPlayer] Video call conditions not met
```

## 🔍 根本原因分析

### **主要原因 1: イベント処理システムの不整合**

**問題:** 参考実装では `Network.ts` にイベント登録メソッド（`onMyPlayerReady`, `onMyPlayerVideoConnected` など）が存在するが、現在の実装では欠落していた。

**詳細:**
- 参考実装: `this.network.onPlayerJoined(this.handlePlayerJoined, this)`
- 現在の実装: `phaserEvents.on(Event.PLAYER_JOINED, this.handlePlayerJoined, this)`

この違いにより、イベントの発火タイミングが異なっていた。

### **主要原因 2: player.onChange の処理順序**

**問題:** プレイヤー作成とプレイヤー更新イベントの処理順序が参考実装と異なっていた。

**現在の実装（問題あり）:**
```typescript
// 先に nameChange をチェックして PLAYER_JOINED を発火
const nameChange = changes.find(change => change.field === 'name' && change.value !== '')
if (nameChange) {
  phaserEvents.emit(Event.PLAYER_JOINED, player, key)
}
// 後で全ての変更を処理
changes.forEach((change) => {
  phaserEvents.emit(Event.PLAYER_UPDATED, field, value, key)
})
```

**参考実装（正しい）:**
```typescript
// 全ての変更を処理し、name の場合のみ追加で PLAYER_JOINED を発火
changes.forEach((change) => {
  const { field, value } = change
  phaserEvents.emit(Event.PLAYER_UPDATED, field, value, key)
  
  if (field === 'name' && value !== '') {
    phaserEvents.emit(Event.PLAYER_JOINED, player, key)
  }
})
```

### **主要原因 3: readyToConnect/videoConnected イベント発火**

**問題:** `Network.readyToConnect()` と `Network.videoConnected()` でローカルイベントを発火していなかった。

**修正前:**
```typescript
readyToConnect() {
  this.room?.send(Message.READY_TO_CONNECT)
}

videoConnected() {
  this.room?.send(Message.VIDEO_CONNECTED)
}
```

**修正後:**
```typescript
readyToConnect() {
  this.room?.send(Message.READY_TO_CONNECT)
  phaserEvents.emit(Event.MY_PLAYER_READY)  // 追加
}

videoConnected() {
  this.room?.send(Message.VIDEO_CONNECTED)
  phaserEvents.emit(Event.MY_PLAYER_VIDEO_CONNECTED)  // 追加
}
```

## 🔧 実施した修正内容

### **修正 1: ファイル全体の置き換え**

参考実装から以下のファイルを**完全コピー**:

1. **`client/src/services/Network.ts`**
   - イベント登録メソッドの追加
   - `player.onChange` 処理の修正
   - イベント発火タイミングの統一

2. **`client/src/characters/OtherPlayer.ts`**
   - `makeCall` ロジックの統一
   - デバッグログの削除

3. **`client/src/web/WebRTC.ts`**
   - PeerJS 処理の統一
   - カメラ初期化タイミングの統一

4. **`server/rooms/SkyOffice.ts`**
   - サーバー側メッセージハンドリングの統一

### **修正 2: Game.ts のイベント登録方式変更**

**修正前:**
```typescript
phaserEvents.on(Event.PLAYER_JOINED, this.handlePlayerJoined, this)
phaserEvents.on(Event.MY_PLAYER_READY, this.handleMyPlayerReady, this)
```

**修正後:**
```typescript
this.network.onPlayerJoined(this.handlePlayerJoined, this)
this.network.onMyPlayerReady(this.handleMyPlayerReady, this)
```

### **修正 3: デバッグログの削除**

過剰なデバッグログを削除し、参考実装と同じシンプルな実装に統一。

## 📊 修正結果

### **修正前の状態**
```
myVideoConnected: true
otherVideoConnected: false  ← 常にfalse
→ ビデオ通話条件が満たされない
```

### **修正後の状態**
```
myVideoConnected: true
otherVideoConnected: true   ← 正常に同期
→ ビデオ通話が正常に開始
```

### **動作確認項目**
- ✅ プレイヤー同士が近づくとビデオ通話が自動開始
- ✅ プレイヤーが離れるとビデオ通話が自動終了
- ✅ 複数プレイヤー間での同時ビデオ通話
- ✅ 音声・映像の双方向通信

## 🧠 学んだ教訓

### **1. 参考実装との完全一致の重要性**

微細な実装差異でも、リアルタイム通信システムでは致命的な問題となる。特にイベント駆動システムでは、イベントの発火順序とタイミングが極めて重要。

### **2. Colyseus スキーマ同期の仕組み**

Colyseus の `player.onChange` は自動的に他のクライアントに同期されるが、イベント処理の実装方法により同期タイミングが変わる。

### **3. デバッグログの弊害**

過剰なデバッグログは実装の複雑化を招き、本来のロジックを見えにくくする。シンプルな実装ほど問題を特定しやすい。

### **4. WebRTC + Colyseus の統合パターン**

- Colyseus: プレイヤー状態の同期（`readyToConnect`, `videoConnected`）
- WebRTC: 実際の音声・映像通信
- Phaser Events: クライアント内部のイベント連携

この3つの技術の連携が正しく実装されて初めて、ビデオ通話機能が動作する。

## 📚 関連ファイル

### **修正対象ファイル**
- `client/src/services/Network.ts`
- `client/src/characters/OtherPlayer.ts`
- `client/src/web/WebRTC.ts`
- `client/src/scenes/Game.ts`
- `server/rooms/SkyOffice.ts`

### **参考リソース**
- 参考実装: `/Users/k_yo/develop/js_work/SkyOfficeContext/`
- Colyseus ドキュメント: https://docs.colyseus.io/
- PeerJS ドキュメント: https://peerjs.com/docs.html

---

**作成者:** Claude Code Assistant  
**修正完了日:** 2025-07-01  
**修正時間:** 約2時間  
**修正方針:** 参考実装との完全一致を重視した全面的な置き換え
