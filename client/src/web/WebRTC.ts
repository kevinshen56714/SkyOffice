import Peer from 'peerjs'
import Network from '../services/Network'
import store from '../stores'
import {
  setCameraPermissionGranted,
  setDevices,
  setMicrophonePermissionGranted,
} from '../stores/UserStore'

export default class WebRTC {
  private myPeer: Peer
  private peers = new Map<string, { call: any; video: HTMLVideoElement }>()
  private onCalledPeers = new Map<string, { call: any; video: HTMLVideoElement }>()
  private videoGrid = document.querySelector('.video-grid')
  private buttonGrid = document.querySelector('.button-grid')
  private myVideo = document.createElement('video')
  private myStream?: MediaStream
  private network: Network

  constructor(userId: string, network: Network) {
    navigator.permissions?.query({ name: 'microphone' as PermissionName }).then((result) => {
      if (result.state === 'granted') store.dispatch(setMicrophonePermissionGranted(true))
    })
    navigator.permissions?.query({ name: 'camera' as PermissionName }).then((result) => {
      if (result.state === 'granted') store.dispatch(setCameraPermissionGranted(true))
    })
    this.getUserDevices()
    const sanitizedId = this.replaceInvalidId(userId)
    this.myPeer = new Peer(sanitizedId)
    this.network = network
    console.log('userId:', userId)
    console.log('sanitizedId:', sanitizedId)
    this.myPeer.on('error', (err) => {
      console.error(err)
    })

    // mute your own video stream (you don't want to hear yourself)
    this.myVideo.muted = true

    // config peerJS
    this.initialize()
  }

  // PeerJS throws invalid_id error if it contains some characters such as that colyseus generates.
  // https://peerjs.com/docs.html#peer-id
  private replaceInvalidId(userId: string) {
    return userId.replace(/[^0-9a-z]/gi, 'G')
  }

  initialize() {
    this.myPeer.on('call', (call) => {
      if (!this.onCalledPeers.has(call.peer)) {
        call.answer(this.myStream)
        const video = document.createElement('video')
        this.onCalledPeers.set(call.peer, { call, video })

        call.on('stream', (userVideoStream) => {
          this.addVideoStream(video, userVideoStream, 'default')
        })
      }
      // on close is triggered manually with deleteOnCalledVideoStream()
    })
  }

  getInitialPermission() {
    navigator.mediaDevices
      ?.getUserMedia({
        video: true,
        audio: true,
      })
      .then((stream) => {
        store.dispatch(setMicrophonePermissionGranted(true))
        store.dispatch(setCameraPermissionGranted(true))
        this.getUserDevices()
        this.network.videoConnected()
      })
  }

  getUserDevices() {
    navigator.mediaDevices.enumerateDevices().then((deviceInfos) => {
      const foundDevices: any[] = []
      for (let i = 0; i !== deviceInfos.length; ++i) {
        const deviceInfo = deviceInfos[i]
        const device = {
          id: deviceInfo.deviceId,
          kind: deviceInfo.kind,
          label: deviceInfo.label,
        }
        foundDevices.push(device)
      }
      store.dispatch(setDevices(foundDevices))
    })
  }

  getUserMedia(alertOnError = true) {
    const state = store.getState()
    if (
      state.user.videoDeviceId !== '' &&
      state.user.audioInputDeviceId !== '' &&
      state.user.audioOutputDeviceId !== ''
    ) {
      const constraints = {
        audio: {
          deviceId: state.user.audioInputDeviceId
            ? { exact: state.user.audioInputDeviceId }
            : undefined,
        },
        video: {
          deviceId: state.user.videoDeviceId ? { exact: state.user.videoDeviceId } : undefined,
        },
      }
      navigator.mediaDevices
        ?.getUserMedia(constraints)
        .then((stream) => {
          this.myStream = stream
          this.addVideoStream(this.myVideo, this.myStream, state.user.audioOutputDeviceId)
          //this.setUpButtons()
        })
        .catch((error) => {
          if (alertOnError) window.alert('No webcam or microphone found, or permission is blocked')
        })
    }
  }

  // method to call a peer
  connectToNewUser(userId: string) {
    const state = store.getState()
    if (this.myStream) {
      const sanitizedId = this.replaceInvalidId(userId)
      if (!this.peers.has(sanitizedId)) {
        console.log('calling', sanitizedId)
        const call = this.myPeer.call(sanitizedId, this.myStream)
        const video = document.createElement('video')
        this.peers.set(sanitizedId, { call, video })

        call.on('stream', (userVideoStream) => {
          this.addVideoStream(video, userVideoStream, state.user.audioOutputDeviceId)
        })

        // on close is triggered manually with deleteVideoStream()
      }
    }
  }

  // Attach audio output device to video element using device/sink ID.
  attachAudioOutputToVideoElement(element, audioDevice) {
    if (typeof element.sinkId !== 'undefined') {
      element
        .setSinkId(audioDevice)
        .then(() => {
          console.log(`Success, audio output device attached: ${audioDevice}`)
        })
        .catch((error) => {
          console.error('Error attaching audio output device ', error)
        })
    } else {
      console.warn('Browser does not support output device selection.')
    }
  }

  // method to add new video stream to videoGrid div
  addVideoStream(video: HTMLVideoElement, stream: MediaStream, audioDevice: string) {
    video.srcObject = stream
    this.attachAudioOutputToVideoElement(video, audioDevice)
    video.playsInline = true
    video.addEventListener('loadedmetadata', () => {
      video.play()
    })
    if (this.videoGrid) this.videoGrid.append(video)
  }

  // method to remove video stream (when we are the host of the call)
  deleteVideoStream(userId: string) {
    const sanitizedId = this.replaceInvalidId(userId)
    if (this.peers.has(sanitizedId)) {
      const peer = this.peers.get(sanitizedId)
      peer?.call.close()
      peer?.video.remove()
      this.peers.delete(sanitizedId)
    }
  }

  // method to remove video stream (when we are the guest of the call)
  deleteOnCalledVideoStream(userId: string) {
    const sanitizedId = this.replaceInvalidId(userId)
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
