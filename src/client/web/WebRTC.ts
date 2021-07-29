import Peer from 'peerjs'

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

  constructor(userId: string) {
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
      })
  }

  //   manageVideoStreams() {
  //     navigator.mediaDevices
  //       .getUserMedia({
  //         video: true,
  //         audio: true,
  //       })
  //       .then((stream) => {
  //         this.myStream = stream
  //         this.addVideoStream(this.myVideo, this.myStream)

  //         this.myPeer.on('call', (call) => {
  //           call.answer(this.myStream)
  //           const video = document.createElement('video')
  //           call.on('stream', (userVideoStream) => {
  //             this.addVideoStream(video, userVideoStream)
  //           })
  //           call.on('close', () => {
  //             video.remove()
  //           })

  //           this.peers[call.peer] = call
  //         })

  //         // socket.on('user-connected', (userId) => {
  //         //   this.connectToNewUser(userId, stream)
  //         // })
  //       })

  //     // socket.on('user-disconnected', (userId) => {
  //     //   if (this.peers[userId]) this.peers[userId].close()
  //     // })

  //     // this.myPeer.on('open', (id) => {
  //     //   socket.emit('join-room', ROOM_ID, id)
  //     // })
  //   }

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

  // var getUserMedia =
  //   navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia
  // getUserMedia(
  //   { video: true, audio: true },
  //   function (stream) {
  //     var call = peer.call('another-peers-id', stream)
  //     call.on('stream', function (remoteStream) {
  //       // Show stream in some video/canvas element.
  //     })
  //   },
  //   function (err) {
  //     console.log('Failed to get local stream', err)
  //   }
  // )

  // navigator.mediaDevices.getUserMedia(
  //   { video: true, audio: true },
  //   (stream) => {
  //     const call = peer.call('another-peers-id', stream)
  //     call.on('stream', (remoteStream) => {
  //       // Show stream in some <video> element.
  //     })
  //   },
  //   (err) => {
  //     console.error('Failed to get local stream', err)
  //   }
  // )
}
