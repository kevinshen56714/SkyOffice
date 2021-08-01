import Peer from 'peerjs'
import Network from '../services/Network'

export default class WebRTC {
  private myPeer: Peer
  private peers = {}
  private videoGrid = document.getElementById('video-grid')
  private buttonGrid = document.getElementById('button-grid')
  private myVideo = document.createElement('video')
  private myStream?: MediaStream

  constructor(userId: string, network: Network) {
    this.myPeer = new Peer(userId)

    // mute your own video stream (you don't want to hear to yourself)
    this.myVideo.muted = true

    // ask the browser to get use media
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
          call.on('close', () => {
            video.remove()
          })

          this.peers[call.peer] = call
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

    this.peers[userId] = call
  }

  // method to add new video stream to videoGrid div
  addVideoStream(video: HTMLVideoElement, stream: MediaStream) {
    video.srcObject = stream
    video.addEventListener('loadedmetadata', () => {
      video.play()
    })
    if (this.videoGrid) {
      this.videoGrid.append(video)
    }
  }

  // method to remove video stream a peer disconnects
  deleteVideoStream(userId: string) {
    if (this.peers[userId]) this.peers[userId].close()
  }

  // method to set up mute/unmute and video on/off buttons
  setUpButtons() {
    const audioButton = document.createElement('button')
    audioButton.innerHTML = 'Mute'
    audioButton.addEventListener('click', () => {
      if (this.myStream) {
        const audioTrack = this.myStream.getAudioTracks()[0]
        if (audioTrack.enabled) {
          audioTrack.enabled = false
          audioButton.innerHTML = 'Unmute'
        } else {
          audioTrack.enabled = true
          audioButton.innerHTML = 'Mute'
        }
      }
    })
    const videoButton = document.createElement('button')
    videoButton.innerHTML = 'Video off'
    videoButton.addEventListener('click', () => {
      if (this.myStream) {
        const audioTrack = this.myStream.getVideoTracks()[0]
        if (audioTrack.enabled) {
          audioTrack.enabled = false
          videoButton.innerHTML = 'Video on'
        } else {
          audioTrack.enabled = true
          videoButton.innerHTML = 'Video off'
        }
      }
    })
    if (this.buttonGrid) {
      this.buttonGrid.append(audioButton)
      this.buttonGrid.append(videoButton)
    }
  }
}
