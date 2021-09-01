import Peer from 'peerjs'
import Network from '../services/Network'

export default class WebRTC {
  private myPeer: Peer
  peers = new Map<string, Peer.MediaConnection>()
  onCalledVideos = new Map<string, HTMLVideoElement>()
  private videoGrid = document.querySelector('.video-grid')
  private buttonGrid = document.querySelector('.button-grid')
  private myVideo = document.createElement('video')
  private myStream?: MediaStream

  constructor(userId: string, network: Network) {
    this.myPeer = new Peer(userId)

    // mute your own video stream (you don't want to hear yourself)
    this.myVideo.muted = true

    // ask the browser to get user media
    navigator.mediaDevices
      .getUserMedia({
        video: true,
        audio: true,
      })
      .then((stream) => {
        this.myStream = stream
        this.addVideoStream(this.myVideo, this.myStream)

        // prepare to be called
        this.myPeer.on('call', (call) => {
          call.answer(this.myStream)
          const video = document.createElement('video')

          call.on('stream', (userVideoStream) => {
            this.addVideoStream(video, userVideoStream)
          })
          // triggered only when the connected peer is destroyed
          call.on('closed', () => {
            video.remove()
            this.onCalledVideos.delete(call.peer)
          })
          this.onCalledVideos.set(call.peer, video)
        })

        this.setUpButtons()

        network.readyToConnect()
      })
  }

  // method to call a peer
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

    this.peers.set(userId, call)
  }

  // method to add new video stream to videoGrid div
  addVideoStream(video: HTMLVideoElement, stream: MediaStream) {
    video.srcObject = stream
    video.addEventListener('loadedmetadata', () => {
      video.play()
    })
    if (this.videoGrid) this.videoGrid.append(video)
  }

  // method to remove video stream (when we are the host of the call)
  deleteVideoStream(userId: string) {
    if (this.peers.has(userId)) {
      const peerCall = this.peers.get(userId)
      peerCall?.close()
      this.peers.delete(userId)
    }
  }

  // method to remove video stream (when we are the guest of the call)
  deleteOnCalledVideoStream(userId: string) {
    if (this.onCalledVideos.has(userId)) {
      const video = this.onCalledVideos.get(userId)
      video?.remove()
      this.onCalledVideos.delete(userId)
    }
  }

  // method to set up mute/unmute and video on/off buttons
  setUpButtons() {
    const audioButton = document.createElement('button')
    audioButton.innerText = 'Mute'
    audioButton.addEventListener('click', () => {
      if (this.myStream) {
        const audioTrack = this.myStream.getAudioTracks()[0]
        if (audioTrack.enabled) {
          audioTrack.enabled = false
          audioButton.innerText = 'Unmute'
        } else {
          audioTrack.enabled = true
          audioButton.innerText = 'Mute'
        }
      }
    })
    const videoButton = document.createElement('button')
    videoButton.innerText = 'Video off'
    videoButton.addEventListener('click', () => {
      if (this.myStream) {
        const audioTrack = this.myStream.getVideoTracks()[0]
        if (audioTrack.enabled) {
          audioTrack.enabled = false
          videoButton.innerText = 'Video on'
        } else {
          audioTrack.enabled = true
          videoButton.innerText = 'Video off'
        }
      }
    })
    this.buttonGrid?.append(audioButton)
    this.buttonGrid?.append(videoButton)
  }
}
