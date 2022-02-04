import Peer from 'peerjs'
import store from '../stores'
import { setMyStream, addVideoStream, removeVideoStream } from '../stores/ComputerStore'
import phaserGame from '../PhaserGame'
import Game from '../scenes/Game'

export default class ShareScreenManager {
  private myPeer: Peer
  myStream?: MediaStream

  constructor(private userId: string) {
    const sanatizedId = this.makeId(userId)
    this.myPeer = new Peer(sanatizedId)
    this.myPeer.on('error', (err) => {
      console.log('ShareScreenWebRTC err.type', err.type)
      console.error('ShareScreenWebRTC', err)
    })

    this.myPeer.on('call', (call) => {
      call.answer()

      call.on('stream', (userVideoStream) => {
        store.dispatch(addVideoStream({ id: call.peer, call, stream: userVideoStream }))
      })
      // we handled on close on our own
    })
  }

  onOpen() {
    if (this.myPeer.disconnected) {
      this.myPeer.reconnect()
    }
  }

  onClose() {
    this.stopScreenShare(false)
    this.myPeer.disconnect()
  }

  // PeerJS throws invalid_id error if it contains some characters such as that colyseus generates.
  // https://peerjs.com/docs.html#peer-id
  // Also for screen sharing ID add a `-ss` at the end.
  private makeId(id: string) {
    return `${id.replace(/[^0-9a-z]/gi, 'G')}-ss`
  }

  startScreenShare() {
    navigator.mediaDevices
      ?.getDisplayMedia({
        video: true,
        audio: true,
      })
      .then((stream) => {
        // Detect when user clicks "Stop sharing" outside of our UI.
        // https://stackoverflow.com/a/25179198
        const track = stream.getVideoTracks()[0]
        if (track) {
          track.onended = () => {
            this.stopScreenShare()
          }
        }

        this.myStream = stream
        store.dispatch(setMyStream(stream))

        // Call all existing users.
        const game = phaserGame.scene.keys.game as Game
        const computerItem = game.computerMap.get(store.getState().computer.computerId!)
        if (computerItem) {
          for (const userId of computerItem.currentUsers) {
            this.onUserJoined(userId)
          }
        }
      })
  }

  // TODO(daxchen): Fix this trash hack, if we call store.dispatch here when calling
  // from onClose, it causes redux reducer cycle, this may be fixable by using thunk
  // or something.
  stopScreenShare(shouldDispatch = true) {
    this.myStream?.getTracks().forEach((track) => track.stop())
    this.myStream = undefined
    if (shouldDispatch) {
      store.dispatch(setMyStream(null))
      // Manually let all other existing users know screen sharing is stopped
      const game = phaserGame.scene.keys.game as Game
      game.network.onStopScreenShare(store.getState().computer.computerId!)
    }
  }

  onUserJoined(userId: string) {
    if (!this.myStream || userId === this.userId) return

    const sanatizedId = this.makeId(userId)
    this.myPeer.call(sanatizedId, this.myStream)
  }

  onUserLeft(userId: string) {
    if (userId === this.userId) return

    const sanatizedId = this.makeId(userId)
    store.dispatch(removeVideoStream(sanatizedId))
  }
}
