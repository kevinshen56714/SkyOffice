import { useEffect, useState } from 'react'

export const isSmallScreenWidth = (smallScreenSize: number) => {
  const [width, setWidth] = useState(window.innerWidth)

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return width <= smallScreenSize
}

export const isSmallScreenHeight = (smallScreenSize: number) => {
  const [height, setHeight] = useState(window.innerHeight)

  useEffect(() => {
    const handleResize = () => setHeight(window.innerHeight)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return height <= smallScreenSize
}
