import { VideoHTMLAttributes, useEffect, useRef } from 'react'

type PropsType = VideoHTMLAttributes<HTMLVideoElement> & {
  srcObject: MediaStream
}

export default function Video({ srcObject, ...props }: PropsType) {
  const refVideo = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (!refVideo.current) return
    refVideo.current.srcObject = srcObject
  }, [srcObject])

  return <video ref={refVideo} {...props} />
}
