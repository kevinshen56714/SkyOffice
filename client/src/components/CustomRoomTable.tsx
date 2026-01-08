import React, { useState } from 'react'
import styled from 'styled-components'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import TableContainer from '@mui/material/TableContainer'
import Table from '@mui/material/Table'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import Tooltip from '@mui/material/Tooltip'
import TextField from '@mui/material/TextField'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import Alert from '@mui/material/Alert'
import Avatar from '@mui/material/Avatar'
import PeopleAltIcon from '@mui/icons-material/PeopleAlt'
import LockIcon from '@mui/icons-material/Lock'
import { useAppSelector } from '../hooks'
import { getAvatarString, getColorByString } from '../util'
import { isSmallScreenWidth } from '../utils'

import phaserGame from '../PhaserGame'
import Bootstrap from '../scenes/Bootstrap'
import {
  List,
  ListItem,
  ListItemAvatar,
  ListItemSecondaryAction,
  ListItemText,
} from '@mui/material'

const MessageText = styled.p`
  margin: 10px;
  font-size: 18px;
  color: #eee;
  text-align: center;
`

const CustomRoomTableContainer = styled(TableContainer)<{
  component: React.ElementType
}>`
  max-height: 325px; // TODO - make this dynamic

  table {
    min-width: 650px;
  }
`

const TableRowWrapper = styled(TableRow)`
  &:last-child td,
  &:last-child th {
    border: 0;
  }

  .avatar {
    height: 30px;
    width: 30px;
    font-size: 15px;
  }

  .name {
    min-width: 100px;
    overflow-wrap: anywhere;
  }

  .description {
    min-width: 200px;
    overflow-wrap: anywhere;
  }

  .join-wrapper {
    display: flex;
    gap: 3px;
    align-items: center;
  }

  .lock-icon {
    font-size: 18px;
  }
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

const ListWrapper = styled(List)`

padding-top: 0px;
padding-bottom: 0px;

  .MuiListItem-container {
    padding-left: 16px;
    padding-right: 16px;
    &:after {
      content: '';
      position: absolute;
      left: 0;
      right: 0;
      height: 1px;
      background: #3f3f3f;
  }

  .avatar{
    align-self: start;
    padding: 8px
  }

  .list-item {
    text-align: justify;
    padding: 0;
  }

  .secondary-action-content {
    display: flex;
    flex-direction: column;
    justify-content: center;
    position: unset;
    transform: unset;
    margin-bottom: 16px;

    .extra-info {
      display: flex;
      flex-direction: row;
      margin-top: 16px;
      padding: 16px;
      flex: 1;
      gap: 3px;
      font-size: 12px;
      color: #aaa;
      place-content: space-between;

      .id-room {
        font-size: 12px;
        color: #aaa;
      }
  
      .clients {
        display: flex;
        align-items: center;
        gap: 3px;
        font-size: 12px;
        color: white;
      }
    }

    .MuiButton-root {
      height: 48px;
      flex: 0.5;
  }

  .join-wrapper {
    display: flex;
    gap: 3px;
    align-items: center;
  }

  .people-icon {
    color: white;
    font-size: 18px;
  }

  .lock-icon {
    font-size: 18px;
  }

`

export const CustomRoomTable = () => {
  const [password, setPassword] = useState('')
  const [selectedRoom, setSelectedRoom] = useState('')
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [showPasswordError, setShowPasswordError] = useState(false)
  const [passwordFieldEmpty, setPasswordFieldEmpty] = useState(false)
  const lobbyJoined = useAppSelector((state) => state.room.lobbyJoined)
  const availableRooms = useAppSelector((state) => state.room.availableRooms)

  const handleJoinClick = (roomId: string, password: string | null) => {
    if (!lobbyJoined) return
    const bootstrap = phaserGame.scene.keys.bootstrap as Bootstrap
    bootstrap.network
      .joinCustomById(roomId, password)
      .then(() => bootstrap.launchGame())
      .catch((error) => {
        console.error(error)
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
  }

  const hasSmallScreen = isSmallScreenWidth(750)

  return availableRooms.length === 0 ? (
    <MessageText>There are no custom rooms now, create one or join the public lobby.</MessageText>
  ) : (
    <>
      <CustomRoomTableContainer component={Paper}>
        {hasSmallScreen ? (
          <List>
            {availableRooms.map((room) => {
              const { roomId, metadata, clients } = room
              const { name, description, hasPassword } = metadata
              return (
                <ListWrapper key={roomId}>
                  <ListItem key={`item-${roomId}`} className="list-item">
                    <ListItemAvatar className="avatar">
                      <Avatar style={{ background: getColorByString(name) }}>
                        {getAvatarString(name)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText primary={name} secondary={description} />
                    <ListItemSecondaryAction className="secondary-action-content">
                      <div className="extra-info">
                        <div className="id-room">
                          <span style={{ fontWeight: 'bold', color: 'white' }}>ID: </span>
                          {roomId}
                        </div>
                        <div className="clients">
                          <PeopleAltIcon className="people-icon" />
                          {clients}
                        </div>
                      </div>
                      <Tooltip title={hasPassword ? 'Password required' : ''}>
                        <Button
                          className="join-button"
                          variant="outlined"
                          color="secondary"
                          onClick={() => {
                            if (hasPassword) {
                              setShowPasswordDialog(true)
                              setSelectedRoom(roomId)
                            } else {
                              handleJoinClick(roomId, null)
                            }
                          }}
                        >
                          <div className="join-wrapper">
                            {hasPassword && <LockIcon className="lock-icon" />}
                            Join
                          </div>
                        </Button>
                      </Tooltip>
                    </ListItemSecondaryAction>
                  </ListItem>
                </ListWrapper>
              )
            })}
          </List>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell></TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>ID</TableCell>
                <TableCell align="center">
                  <PeopleAltIcon />
                </TableCell>
                <TableCell align="right"></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {availableRooms.map((room) => {
                const { roomId, metadata, clients } = room
                const { name, description, hasPassword } = metadata
                return (
                  <TableRowWrapper key={roomId}>
                    <TableCell>
                      <Avatar className="avatar" style={{ background: getColorByString(name) }}>
                        {getAvatarString(name)}
                      </Avatar>
                    </TableCell>
                    <TableCell>
                      <div className="name">{name}</div>
                    </TableCell>
                    <TableCell>
                      <div className="description">{description}</div>
                    </TableCell>
                    <TableCell>{roomId}</TableCell>
                    <TableCell align="center">{clients}</TableCell>
                    <TableCell align="center">
                      <Tooltip title={hasPassword ? 'Password required' : ''}>
                        <Button
                          variant="outlined"
                          color="secondary"
                          onClick={() => {
                            if (hasPassword) {
                              setShowPasswordDialog(true)
                              setSelectedRoom(roomId)
                            } else {
                              handleJoinClick(roomId, null)
                            }
                          }}
                        >
                          <div className="join-wrapper">
                            {hasPassword && <LockIcon className="lock-icon" />}
                            Join
                          </div>
                        </Button>
                      </Tooltip>
                    </TableCell>
                  </TableRowWrapper>
                )
              })}
            </TableBody>
          </Table>
        )}
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
