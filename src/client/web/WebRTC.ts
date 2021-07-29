import Peer from 'peerjs'
import Network from '../services/Network'

export default class WebRTC {
  private myPeer: Peer
  private peers = {}
  private videoGrid: HTMLElement | null
  private myVideo: HTMLVideoElement

  private _myStream?: MediaStream
  set myStream(stream: MediaStream | undefined) {
    this._myStream = stream
  }
  get myStream() {
    if (this._myStream) return this._myStream
  }

  constructor(userId: string, network: Network) {
    this.myPeer = new Peer(userId)
    this.videoGrid = document.getElementById('video-grid')
    this.myVideo = document.createElement('video')
    this.myVideo.muted = true
    navigator.mediaDevices
      .getUserMedia({
        video: true,
        audio: true,
      })
      .then((stream) => {
        this.myStream = stream
        this.addVideoStream(this.myVideo, this.myStream)

        this.myPeer.on('call', (call) => {
          call.answer(this.myStream)
          const video = document.createElement('video')
          call.on('stream', (userVideoStream) => {
            this.addVideoStream(video, userVideoStream)
          })
          call.on('close', () => {
            video.remove()
          })

          this.peers[call.peer] = call
        })

        network.readyToConnect()
      })
  }

  connectToNewUser(userId: string) {
    if (!this.myStream) return
    const call = this.myPeer.call(userId, this.myStream)
    const video = document.createElement('video')
    call.on('stream', (userVideoStream) => {
      this.addVideoStream(video, userVideoStream)
    })
    call.on('close', () => {
      video.remove()
    })

    this.peers[userId] = call
  }

  addVideoStream(video: HTMLVideoElement, stream: MediaStream) {
    video.srcObject = stream
    video.addEventListener('loadedmetadata', () => {
      video.play()
    })
    if (this.videoGrid) this.videoGrid.append(video)
  }

  deleteVideoStream(userId: string) {
    if (this.peers[userId]) this.peers[userId].close()
  }
}
