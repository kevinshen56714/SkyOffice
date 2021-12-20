import React, { useState } from 'react'
import logo from '../assets/logo.png'
import styled from 'styled-components'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Paper from '@mui/material/Paper'
import TableContainer from '@mui/material/TableContainer'
import Table from '@mui/material/Table'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import Tooltip from '@mui/material/Tooltip'
import LinearProgress from '@mui/material/LinearProgress'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import PeopleAltIcon from '@mui/icons-material/PeopleAlt'
import LockIcon from '@mui/icons-material/Lock'
import RefreshIcon from '@mui/icons-material/Refresh'

import { useAppDispatch } from '../hooks'
import { setRoomSelected } from '../stores/UserStore'

import phaserGame from '../PhaserGame'
import Bootstrap from '../scenes/Bootstrap'

const Wrapper = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #222639;
  border-radius: 16px;
  padding: 36px 60px;
`

const CustomRoomWrapper = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 20px;
  align-items: center;
  justify-content: center;
`

const BackButtonWrapper = styled.div`
  position: absolute;
  top: 0;
  left: 0;
`

const RefreshButtonWrapper = styled.div`
  position: absolute;
  top: 0;
  right: 0;
`

const Title = styled.h1`
  font-size: 24px;
  color: #eee;
  text-align: center;
`

const MessageText = styled.p`
  margin: 10px;
  font-size: 18px;
  color: #eee;
  text-align: center;
`

const ProgressBar = styled(LinearProgress)`
  width: 360px;
  margin: 60px 30px;
`

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin: 20px 0;
  align-items: center;
  justify-content: center;

  img {
    border-radius: 8px;
    height: 120px;
  }
`

const TableRowWrapper = styled(TableRow)`
  &:last-child td,
  &:last-child th {
    border: 0;
  }
`

interface RoomDisplayProps {
  roomId: string
  name: string
  description: string
  password: string
  clients: number
}

const fetchRoomArray = ({ onFinish }) => {
  const updatedRoomArray = new Array<RoomDisplayProps>()
  const bootstrap = phaserGame.scene.keys.bootstrap as Bootstrap
  bootstrap.network
    .getAvailableRooms()
    .then((rooms) => {
      rooms.forEach((room) => {
        const roomData = room.metadata as RoomDisplayProps
        updatedRoomArray.push({
          roomId: room.roomId,
          name: roomData.name,
          description: roomData.description,
          password: roomData.password,
          clients: room.clients,
        })
      })
      onFinish()
    })
    .catch((e) => {
      console.error(e)
    })

  return updatedRoomArray
}

const CustomRoomTable = (props: { roomArray: RoomDisplayProps[] }) => {
  return props.roomArray.length === 0 ? (
    <MessageText>There are no custom rooms now, create one or join the public lobby.</MessageText>
  ) : (
    <TableContainer sx={{ maxHeight: 500 }} component={Paper}>
      <Table sx={{ minWidth: 650 }}>
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Name</TableCell>
            <TableCell>Description</TableCell>
            <TableCell align="center">
              <PeopleAltIcon />
            </TableCell>
            <TableCell align="right"></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {props.roomArray.map((room) => (
            <TableRowWrapper key={room.roomId}>
              <TableCell>
                {room.password && (
                  <Tooltip title="Password required">
                    <LockIcon />
                  </Tooltip>
                )}
                {room.roomId}
              </TableCell>
              <TableCell>{room.name}</TableCell>
              <TableCell>{room.description}</TableCell>
              <TableCell align="center">{room.clients}</TableCell>
              <TableCell>
                <Button variant="outlined" color="secondary">
                  Join
                </Button>
              </TableCell>
            </TableRowWrapper>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

export default function RoomSelectionDialog() {
  const [showCustomRoom, setShowCustomRoom] = useState(false)
  const [roomArray, setRoomArray] = useState<RoomDisplayProps[]>([])
  const [isFetching, setIsFetching] = useState(false)
  const dispatch = useAppDispatch()

  const handleConnect = () => {
    const bootstrap = phaserGame.scene.keys.bootstrap as Bootstrap
    dispatch(setRoomSelected(true))
    bootstrap.launchGame()
  }

  const handleFetch = () => {
    setIsFetching(true)
    const updatedRoomArray = fetchRoomArray({
      onFinish: () => {
        setIsFetching(false)
      },
    })
    setRoomArray(updatedRoomArray)
  }

  return (
    <Wrapper>
      {showCustomRoom ? (
        <CustomRoomWrapper>
          <BackButtonWrapper>
            <IconButton onClick={() => setShowCustomRoom(false)}>
              <ArrowBackIcon />
            </IconButton>
          </BackButtonWrapper>
          {!isFetching && (
            <RefreshButtonWrapper>
              <IconButton onClick={handleFetch}>
                <RefreshIcon />
              </IconButton>
            </RefreshButtonWrapper>
          )}
          <Title>Custom Rooms</Title>
          {isFetching ? (
            <ProgressBar color="secondary" />
          ) : (
            <CustomRoomTable roomArray={roomArray} />
          )}
          <Button variant="contained" color="secondary" size="large">
            Create new room
          </Button>
        </CustomRoomWrapper>
      ) : (
        <>
          <Title>Welcome to SkyOffice</Title>
          <Content>
            <img src={logo} alt="logo" />
            <Button variant="contained" color="secondary" onClick={handleConnect}>
              Connect to public lobby
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => {
                setShowCustomRoom(true)
                handleFetch()
              }}
            >
              Create/find custom rooms
            </Button>
          </Content>
        </>
      )}
    </Wrapper>
  )
}
