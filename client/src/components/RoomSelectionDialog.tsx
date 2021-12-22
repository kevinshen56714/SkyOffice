import React, { useEffect, useState } from 'react'
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
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import LinearProgress from '@mui/material/LinearProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import Alert from '@mui/material/Alert'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import PeopleAltIcon from '@mui/icons-material/PeopleAlt'
import LockIcon from '@mui/icons-material/Lock'
import RefreshIcon from '@mui/icons-material/Refresh'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'

import { IRoomData } from '../../../types/IRoomData'

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
  box-shadow: 0px 0px 5px #0000006f;
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

  .lock-icon {
    font-size: 18px;
  }
`

const CustomRoomTableContainer = styled(TableContainer)`
  max-height: 500px;

  table {
    min-width: 650px;
  }
`

const CreateRoomFormWrapper = styled.form`
  display: flex;
  flex-direction: column;
  width: 320px;
  gap: 20px;
`

const PasswordDialog = styled(Dialog)`
  .dialog-content {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .MuiDialog-paper {
    background: #222639;
  }
`

interface RoomDisplayProps {
  roomId: string
  name: string
  description: string
  hasPassword: boolean
  clients: number
}

const fetchRoomArray = (props: { onFinish: () => void }) => {
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
          hasPassword: roomData.hasPassword,
          clients: room.clients,
        })
      })
      props.onFinish()
    })
    .catch((error) => {
      console.error(error)
    })

  return updatedRoomArray
}

const CustomRoomTable = (props: { roomArray: RoomDisplayProps[]; onReset: () => void }) => {
  const [password, setPassword] = useState('')
  const [selectedRoom, setSelectedRoom] = useState('')
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [showPasswordError, setShowPasswordError] = useState(false)
  const [passwordFieldEmpty, setPasswordFieldEmpty] = useState(false)

  const handleJoinClick = (roomId: string, password: string | null) => {
    const bootstrap = phaserGame.scene.keys.bootstrap as Bootstrap
    bootstrap.network
      .joinCustomById(roomId, password)
      .then(() => bootstrap.launchGame())
      .catch((error) => {
        console.log(error)
        if (password) setShowPasswordError(true)
      })
  }

  const handlePasswordSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const isValidPassword = password !== ''

    if (isValidPassword === passwordFieldEmpty) setPasswordFieldEmpty(!passwordFieldEmpty)
    if (isValidPassword) handleJoinClick(selectedRoom, password)
  }

  const resetPasswordDialog = () => {
    setShowPasswordDialog(false)
    setPassword('')
    setPasswordFieldEmpty(false)
    setShowPasswordError(false)
    props.onReset()
  }

  return props.roomArray.length === 0 ? (
    <MessageText>There are no custom rooms now, create one or join the public lobby.</MessageText>
  ) : (
    <>
      <CustomRoomTableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell style={{ width: '10px' }}></TableCell>
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
                  {room.hasPassword && (
                    <Tooltip title="Password required">
                      <LockIcon className="lock-icon" />
                    </Tooltip>
                  )}
                </TableCell>
                <TableCell>{room.roomId}</TableCell>
                <TableCell>{room.name}</TableCell>
                <TableCell>{room.description}</TableCell>
                <TableCell align="center">{room.clients}</TableCell>
                <TableCell>
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={() => {
                      if (room.hasPassword) {
                        setShowPasswordDialog(true)
                        setSelectedRoom(room.roomId)
                      } else {
                        handleJoinClick(room.roomId, null)
                      }
                    }}
                  >
                    Join
                  </Button>
                </TableCell>
              </TableRowWrapper>
            ))}
          </TableBody>
        </Table>
      </CustomRoomTableContainer>
      <PasswordDialog open={showPasswordDialog} onClose={resetPasswordDialog}>
        <form onSubmit={handlePasswordSubmit}>
          <DialogContent className="dialog-content">
            <MessageText>This a private room, please enter password:</MessageText>
            <TextField
              autoFocus
              fullWidth
              error={passwordFieldEmpty}
              helperText={passwordFieldEmpty && 'Required'}
              value={password}
              label="Password"
              type="password"
              variant="outlined"
              color="secondary"
              onInput={(e) => {
                setPassword((e.target as HTMLInputElement).value)
              }}
            />
            {showPasswordError && (
              <Alert severity="error" variant="outlined">
                Incorrect Password!
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button color="secondary" onClick={resetPasswordDialog}>
              Cancel
            </Button>
            <Button color="secondary" type="submit">
              Join
            </Button>
          </DialogActions>
        </form>
      </PasswordDialog>
    </>
  )
}

const CreateRoomForm = () => {
  const [values, setValues] = useState<IRoomData>({
    name: '',
    description: '',
    password: null,
    autoDispose: true,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [nameFieldEmpty, setNameFieldEmpty] = useState(false)
  const [descriptionFieldEmpty, setDescriptionFieldEmpty] = useState(false)

  const handleChange = (prop: keyof IRoomData) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setValues({ ...values, [prop]: event.target.value })
  }
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const isValidName = values.name !== ''
    const isValidDescription = values.description !== ''

    if (isValidName === nameFieldEmpty) setNameFieldEmpty(!nameFieldEmpty)
    if (isValidDescription === descriptionFieldEmpty)
      setDescriptionFieldEmpty(!descriptionFieldEmpty)

    // create custom room if name and description are not empty, else show error
    if (isValidName && isValidDescription) {
      const bootstrap = phaserGame.scene.keys.bootstrap as Bootstrap
      bootstrap.network
        .createCustom(values)
        .then(() => bootstrap.launchGame())
        .catch((error) => console.log(error))
    }
  }

  return (
    <CreateRoomFormWrapper onSubmit={handleSubmit}>
      <TextField
        label="Name"
        variant="outlined"
        color="secondary"
        autoFocus
        error={nameFieldEmpty}
        helperText={nameFieldEmpty && 'Name is required'}
        onChange={handleChange('name')}
      />

      <TextField
        label="Description"
        variant="outlined"
        color="secondary"
        error={descriptionFieldEmpty}
        helperText={descriptionFieldEmpty && 'Description is required'}
        multiline
        rows={4}
        onChange={handleChange('description')}
      />

      <TextField
        type={showPassword ? 'text' : 'password'}
        label="Password (optional)"
        onChange={handleChange('password')}
        color="secondary"
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                aria-label="toggle password visibility"
                onClick={() => setShowPassword(!showPassword)}
                edge="end"
              >
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
      <Button variant="contained" color="secondary" type="submit">
        Create
      </Button>
    </CreateRoomFormWrapper>
  )
}

export default function RoomSelectionDialog() {
  const [showCustomRoom, setShowCustomRoom] = useState(false)
  const [showCreateRoomForm, setShowCreateRoomForm] = useState(false)
  const [roomArray, setRoomArray] = useState<RoomDisplayProps[]>([])
  const [isFetching, setIsFetching] = useState(false)

  const handleConnect = () => {
    const bootstrap = phaserGame.scene.keys.bootstrap as Bootstrap
    bootstrap.network
      .joinOrCreatePublic()
      .then(() => bootstrap.launchGame())
      .catch((error) => console.log(error))
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

  useEffect(() => {
    if (showCustomRoom && !showCreateRoomForm) handleFetch()
  }, [showCustomRoom, showCreateRoomForm])

  return (
    <Wrapper>
      {showCreateRoomForm ? (
        <CustomRoomWrapper>
          <Title>Create Custom Room</Title>
          <BackButtonWrapper>
            <IconButton onClick={() => setShowCreateRoomForm(false)}>
              <ArrowBackIcon />
            </IconButton>
          </BackButtonWrapper>
          <CreateRoomForm />
        </CustomRoomWrapper>
      ) : showCustomRoom ? (
        <CustomRoomWrapper>
          <Title>Custom Rooms</Title>
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
          {isFetching ? (
            <ProgressBar color="secondary" />
          ) : (
            <CustomRoomTable roomArray={roomArray} onReset={handleFetch} />
          )}
          <Button variant="contained" color="secondary" onClick={() => setShowCreateRoomForm(true)}>
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
            <Button variant="outlined" color="secondary" onClick={() => setShowCustomRoom(true)}>
              Create/find custom rooms
            </Button>
          </Content>
        </>
      )}
    </Wrapper>
  )
}
