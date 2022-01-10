import Peer from 'peerjs'
import store from '../stores'
import { setVideoConnected } from '../stores/UserStore'
import network from '../services/Network'

export default class WebRTC {
  private myPeer: Peer
  private peers = new Map<string, Peer.MediaConnection>()
  private onCalledPeers = new Map<string, Peer.MediaConnection>()
  private videoGrid = document.querySelector('.video-grid')
  private buttonGrid = document.querySelector('.button-grid')
  private myVideo = document.createElement('video')
  private myStream?: MediaStream

  constructor(webRTCId: string) {
    const sanitizedId = this.replaceInvalidId(webRTCId)
    this.myPeer = new Peer(sanitizedId)
    console.log('webRTCId:', webRTCId)
    console.log('sanitizedId:', sanitizedId)
    this.myPeer.on('error', (err) => {
      console.log(err.type)
      console.error(err)
    })

    // mute your own video stream (you don't want to hear yourself)
    this.myVideo.muted = true

    // config peerJS
    this.initialize()
  }

  // PeerJS throws invalid_id error if it contains some characters such as that colyseus generates.
  // https://peerjs.com/docs.html#peer-id
  private replaceInvalidId(webRTCId: string) {
    return webRTCId.replace(/[^0-9a-z]/gi, 'G')
  }

  initialize() {
    this.myPeer.on('call', (call) => {
      call.answer(this.myStream)
      const video = document.createElement('video')

      call.on('stream', (userVideoStream) => {
        this.addVideoStream(video, userVideoStream)
      })
      // triggered manually with deleteOnCalledVideoStream()
      call.on('close', () => {
        video.remove()
        this.onCalledPeers.delete(call.peer)
      })
      call.on('error', (err) => {
        console.log(err)
      })
      this.onCalledPeers.set(call.peer, call)
    })
  }

  // check if permission has been granted before
  checkPreviousPermission() {
    const permissionName = 'microphone' as PermissionName
    navigator.permissions.query({ name: permissionName }).then((result) => {
      if (result.state === 'granted') this.getUserMedia()
    })
  }

  getUserMedia() {
    // ask the browser to get user media
    navigator.mediaDevices
      ?.getUserMedia({
        video: true,
        audio: true,
      })
      .then((stream) => {
        this.myStream = stream
        this.addVideoStream(this.myVideo, this.myStream)
        this.setUpButtons()
        store.dispatch(setVideoConnected(true))
        network.videoConnected()
      })
      .catch((error) => {
        store.dispatch(setVideoConnected(false))
        window.alert('No webcam or microphone found, or permission is blocked')
      })
  }

  // method to call a peer
  connectToNewUser(webRTCId: string) {
    if (this.myStream) {
      const sanitizedId = this.replaceInvalidId(webRTCId)
      if (!this.onCalledPeers.has(sanitizedId) && !this.peers.has(sanitizedId)) {
        console.log('calling', sanitizedId)
        const call = this.myPeer.call(sanitizedId, this.myStream)
        const video = document.createElement('video')
        call.on('stream', (userVideoStream) => {
          this.addVideoStream(video, userVideoStream)
        })
        call.on('close', () => {
          video.remove()
          this.peers.delete(sanitizedId)
        })
        this.peers.set(sanitizedId, call)
      }
    }
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
  deleteVideoStream(webRTCId: string) {
    const sanitizedId = this.replaceInvalidId(webRTCId)
    if (this.peers.has(sanitizedId)) {
      const peerCall = this.peers.get(sanitizedId)
      peerCall?.close()
    }
  }

  // method to remove video stream (when we are the guest of the call)
  deleteOnCalledVideoStream(webRTCId: string) {
    const sanitizedId = this.replaceInvalidId(webRTCId)
    if (this.onCalledPeers.has(sanitizedId)) {
      const onCalledPeer = this.onCalledPeers.get(sanitizedId)
      onCalledPeer?.close()
    }
  }

  // method to remove all connected peers and videos (used when changing scenes)
  reset() {
    for (const key of this.peers.keys()) {
      this.deleteVideoStream(key)
    }
    for (const key of this.onCalledPeers.keys()) {
      this.deleteOnCalledVideoStream(key)
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
