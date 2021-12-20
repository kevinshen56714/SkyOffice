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
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import PeopleAltIcon from '@mui/icons-material/PeopleAlt'
import LockIcon from '@mui/icons-material/Lock'

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

const BackButton = styled.div`
  position: absolute;
`

const Title = styled.h1`
  font-size: 24px;
  color: #eee;
  text-align: center;
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

const CustomRoomTable = () => {
  function createData(name: string, calories: string, fat: number, carbs: number, protein: number) {
    return { name, calories, fat, carbs, protein }
  }

  const rows = [
    createData('Frozen yoghurt', 'Frozen yoghurt', 6.0, 24, 4.0),
    createData('Ice cream sandwich', 'Frozen yoghurt', 9.0, 37, 4.3),
    createData(
      'Eclair',
      'Frozen yoghurtFrozen yoghurtFrozen yoghurtFrozen yoghurtFrozen yoghurtFrozen yoghurtFrozen yoghurtFrozen yoghurt',
      16.0,
      24,
      6.0
    ),
    createData('Cupcake', 'Frozen yoghurt', 3.7, 67, 4.3),
    createData('Gingerbread', 'Frozen yoghurt', 16.0, 49, 3.9),
  ]
  return (
    <TableContainer sx={{ maxHeight: 500 }} component={Paper}>
      <Table sx={{ minWidth: 650 }} aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell></TableCell>
            <TableCell>Name</TableCell>
            <TableCell>Description</TableCell>
            <TableCell align="center">
              <PeopleAltIcon />
            </TableCell>
            <TableCell align="right"></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.name} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
              <TableCell>
                <Tooltip title="Password required">
                  <LockIcon />
                </Tooltip>
              </TableCell>
              <TableCell component="th" scope="row">
                {row.name}
              </TableCell>
              <TableCell align="left">{row.calories}</TableCell>
              <TableCell align="center">{row.fat}</TableCell>
              <TableCell align="right">
                <Button variant="contained" color="secondary" size="small">
                  Join
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

export default function RoomSelectionDialog() {
  const [showCustomRoom, setShowCustomRoom] = useState(false)
  const dispatch = useAppDispatch()

  const handleConnect = () => {
    const bootstrap = phaserGame.scene.keys.bootstrap as Bootstrap
    dispatch(setRoomSelected(true))
    bootstrap.launchGame()
  }

  return (
    <Wrapper>
      {showCustomRoom ? (
        <>
          <BackButton>
            <IconButton onClick={() => setShowCustomRoom(false)}>
              <ArrowBackIcon />
            </IconButton>
          </BackButton>
          <Title>Custom Rooms</Title>
          <CustomRoomTable />
        </>
      ) : (
        <>
          <Title>Welcome to SkyOffice</Title>
          <Content>
            <img src={logo} alt="logo" />
            <Button variant="contained" color="secondary" onClick={handleConnect}>
              Connect to public lobby
            </Button>
            <Button variant="outlined" color="secondary" onClick={() => setShowCustomRoom(true)}>
              Create/find custom rooms
            </Button>
          </Content>
        </>
      )}
    </Wrapper>
  )
}
