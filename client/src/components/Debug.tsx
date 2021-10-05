import React /*, { useState }*/ from 'react'
import TextField from '@mui/material/TextField'
// import IconButton from '@mui/material/IconButton'
// import Button from '@mui/material/Button'
// import DeleteIcon from '@mui/icons-material/Delete'
import { useAppSelector /*, useAppDispatch */ } from '../hooks'
// import { decrement, increment } from '../stores/UserStore'

import styled from 'styled-components'
import phaserGame from '../PhaserGame'
import Game from '../scenes/Game'

// Import Swiper React components
import { Swiper, SwiperSlide } from 'swiper/react'

// swiper bundle styles
import 'swiper/swiper-bundle.min.css'

// swiper core styles
import 'swiper/swiper.min.css'

// modules styles
import 'swiper/components/navigation/navigation.min.css'
// import Swiper core and required modules
import SwiperCore, { Navigation } from 'swiper'
// install Swiper modules
SwiperCore.use([Navigation])

const Wrapper = styled.div`
  position: fixed;
  top: 0;
  left: 0;
`

const Wrapper2 = styled.div`
  position: relative;
  height: 100%;
  width: 100%;
  background: #eee;
  margin: 0;
  padding: 0;
  top: 30;

  .swiper {
    width: 100%;
    height: 100%;
  }

  .swiper-slide {
    text-align: center;
    font-size: 18px;
    background: #fff;

    /* Center slide text vertically */
    display: -webkit-box;
    display: -ms-flexbox;
    display: -webkit-flex;
    display: flex;
    -webkit-box-pack: center;
    -ms-flex-pack: center;
    -webkit-justify-content: center;
    justify-content: center;
    -webkit-box-align: center;
    -ms-flex-align: center;
    -webkit-align-items: center;
    align-items: center;
  }

  .swiper-slide img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`

export default function Video() {
  // const [showVideo, setShowVideo] = useState<boolean>(false)
  // const [videos, setVideos] = useState<string[]>([])
  const sessionId = useAppSelector((state) => state.user.sessionId)
  // const dispatch = useAppDispatch()

  return (
    <div>
      <Wrapper>
        {/* <Button
        variant="contained"
        onClick={() => {
          setShowVideo(!showVideo)
        }}
      >
        Toggle Video
      </Button>
      <Button
        variant="contained"
        onClick={() => {
          setVideos([...videos, `haha ${Math.random()}`])
        }}
      >
        Add Video
      </Button>
      <Button
        variant="contained"
        onClick={() => {
          dispatch(increment())
        }}
      >
        +
      </Button>
      <Button
        variant="contained"
        onClick={() => {
          dispatch(decrement())
        }}
      >
        -
      </Button> */}
        {/* {count} */}
        <div>sessionId: {sessionId}</div>
        <TextField
          label="PlayerName"
          variant="outlined"
          onInput={(e) => {
            const text = (e.target as HTMLInputElement).value
            const game = phaserGame.scene.keys.game as Game
            game.myPlayer.setPlayerName(text)
          }}
        />

        {/* This is how you write if-else (or conditionally render in react) */}
        {/* {showVideo ? <h1>haha</h1> : null} */}

        {/* This is how you write for-loops (or render multiple elements dynamically in react) */}
        {/* {videos.map((video, i) => (
        <div>
          {video}
          <IconButton
            onClick={() => {
              const clonedVideos = [...videos]
              clonedVideos.splice(i, 1)
              setVideos(clonedVideos)
            }}
          >
            <DeleteIcon />
          </IconButton>
        </div>
      ))} */}
      </Wrapper>
      <Wrapper2>
        <Swiper
          // install Swiper modules
          spaceBetween={0}
          slidesPerView={1}
          navigation
          onSlideChange={(swiper) => console.log(swiper.activeIndex)}
        >
          <SwiperSlide>Slide 1</SwiperSlide>
          <SwiperSlide>Slide 2</SwiperSlide>
          <SwiperSlide>Slide 3</SwiperSlide>
          <SwiperSlide>Slide 4</SwiperSlide>
        </Swiper>
      </Wrapper2>
    </div>
  )
}
