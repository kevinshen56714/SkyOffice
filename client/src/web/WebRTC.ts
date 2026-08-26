import Peer, { MediaConnection } from 'peerjs'
import Network from '../services/Network'
import store from '../stores'
import { setVideoConnected } from '../stores/UserStore'
import { peerOptions } from './peerConfig'
import { toPeerId } from '../util'

/** how long a peer stays callable after we last saw it next to us */
const ALLOW_WINDOW_MS = 10000

export default class WebRTC {
  private myPeer: Peer
  private peers = new Map<string, { call: MediaConnection; video: HTMLVideoElement }>()
  private onCalledPeers = new Map<string, { call: MediaConnection; video: HTMLVideoElement }>()
  private videoGrid = document.querySelector('.video-grid')
  private buttonGrid = document.querySelector('.button-grid')
  private myVideo = document.createElement('video')
  private myStream?: MediaStream
  private network: Network
  /** peers we are currently close enough to talk to -> when that expires */
  private allowedPeers = new Map<string, number>()

  constructor(userId: string, network: Network) {
    const sanitizedId = toPeerId(userId)
    this.myPeer = new Peer(sanitizedId, peerOptions())
    this.network = network
    console.log('userId:', userId)
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


  /**
   * Proximity is what authorizes a call, so the game tells us who is currently
   * close enough. The short window past the last overlap keeps a call that is
   * already in flight from being rejected when the two players drift apart
   * while the signalling round trip is still going.
   */
  allowPeer(userId: string) {
    this.allowedPeers.set(toPeerId(userId), Date.now() + ALLOW_WINDOW_MS)
  }

  private isPeerAllowed(peerId: string) {
    const expiresAt = this.allowedPeers.get(peerId)
    if (expiresAt === undefined) return false

    if (expiresAt < Date.now()) {
      this.allowedPeers.delete(peerId)
      return false
    }

    return true
  }

  initialize() {
    this.myPeer.on('call', (call) => {
      // Peer ids are Colyseus session ids, which every client in the room can
      // read out of room state - and the PeerJS broker is shared with the
      // whole internet. Without this check, answering would hand our camera
      // and microphone to anyone who knows or guesses an id.
      if (!this.isPeerAllowed(call.peer)) {
        console.warn('rejected call from peer that is not nearby:', call.peer)
        call.close()
        return
      }

      if (!this.onCalledPeers.has(call.peer)) {
        call.answer(this.myStream)
        const video = document.createElement('video')
        this.onCalledPeers.set(call.peer, { call, video })

        call.on('stream', (userVideoStream) => {
          this.addVideoStream(video, userVideoStream)
        })
      }
      // on close is triggered manually with deleteOnCalledVideoStream()
    })
  }

  // check if permission has been granted before
  checkPreviousPermission() {
    const permissionName = 'microphone' as PermissionName
    navigator.permissions?.query({ name: permissionName }).then((result) => {
      if (result.state === 'granted') this.getUserMedia(false)
    })
  }

  getUserMedia(alertOnError = true) {
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
        this.network.videoConnected()
      })
      .catch((error) => {
        if (alertOnError) window.alert('No webcam or microphone found, or permission is blocked')
      })
  }

  // method to call a peer
  connectToNewUser(userId: string) {
    if (this.myStream) {
      const sanitizedId = toPeerId(userId)
      if (!this.peers.has(sanitizedId)) {
        console.log('calling', sanitizedId)
        const call = this.myPeer.call(sanitizedId, this.myStream)
        const video = document.createElement('video')
        this.peers.set(sanitizedId, { call, video })

        call.on('stream', (userVideoStream) => {
          this.addVideoStream(video, userVideoStream)
        })

        // on close is triggered manually with deleteVideoStream()
      }
    }
  }

  // method to add new video stream to videoGrid div
  addVideoStream(video: HTMLVideoElement, stream: MediaStream) {
    video.srcObject = stream
    video.playsInline = true
    video.addEventListener('loadedmetadata', () => {
      video.play()
    })
    if (this.videoGrid) this.videoGrid.append(video)
  }

  // method to remove video stream (when we are the host of the call)
  deleteVideoStream(userId: string) {
    const sanitizedId = toPeerId(userId)
    this.allowedPeers.delete(sanitizedId)
    if (this.peers.has(sanitizedId)) {
      const peer = this.peers.get(sanitizedId)
      peer?.call.close()
      peer?.video.remove()
      this.peers.delete(sanitizedId)
    }
  }

  // method to remove video stream (when we are the guest of the call)
  deleteOnCalledVideoStream(userId: string) {
    const sanitizedId = toPeerId(userId)
    this.allowedPeers.delete(sanitizedId)
    if (this.onCalledPeers.has(sanitizedId)) {
      const onCalledPeer = this.onCalledPeers.get(sanitizedId)
      onCalledPeer?.call.close()
      onCalledPeer?.video.remove()
      this.onCalledPeers.delete(sanitizedId)
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
