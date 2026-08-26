import React, { useState } from 'react'
import styled from 'styled-components'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'
import TextFieldMui from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'

import { IRoomData, OFFICE_LIFETIMES } from '../../../types/Rooms'
import { newOfficeSlug } from '../shareLink'
import { useAppSelector } from '../hooks'

import phaserGame from '../PhaserGame'
import Bootstrap from '../scenes/Bootstrap'

const CreateRoomFormWrapper = styled.form`
  display: flex;
  flex-direction: column;
  width: 320px;
  gap: 20px;
`

export const CreateRoomForm = () => {
  const [values, setValues] = useState<IRoomData>({
    name: '',
    description: '',
    password: null,
    unlisted: false,
  })
  // 0 means the office closes when everyone leaves and its link dies with it
  const [lifetimeDays, setLifetimeDays] = useState(0)
  const [showPassword, setShowPassword] = useState(false)
  const [nameFieldEmpty, setNameFieldEmpty] = useState(false)
  const [descriptionFieldEmpty, setDescriptionFieldEmpty] = useState(false)
  const lobbyJoined = useAppSelector((state) => state.room.lobbyJoined)

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

    // create custom room if name and description are not empty
    if (isValidName && isValidDescription && lobbyJoined) {
      const bootstrap = phaserGame.scene.keys.bootstrap as Bootstrap
      // an office that should outlive the room needs a stable id to be found by
      const room: IRoomData =
        lifetimeDays > 0 ? { ...values, slug: newOfficeSlug(), lifetimeDays } : values

      bootstrap.network
        .createCustom(room)
        .then(() => bootstrap.launchGame())
        .catch((error) => console.error(error))
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
      <TextFieldMui
        select
        label="Keep this office"
        variant="outlined"
        color="secondary"
        value={lifetimeDays}
        onChange={(event) => setLifetimeDays(Number(event.target.value))}
        helperText={
          lifetimeDays > 0
            ? 'Its link keeps working for that long, even when nobody is inside.'
            : 'The office and its link close once everyone leaves.'
        }
      >
        {OFFICE_LIFETIMES.map((option) => (
          <MenuItem key={option.days} value={option.days}>
            {option.label}
          </MenuItem>
        ))}
      </TextFieldMui>

      <FormControlLabel
        control={
          <Checkbox
            color="secondary"
            checked={values.unlisted}
            onChange={(event) => setValues({ ...values, unlisted: event.target.checked })}
          />
        }
        label="Unlisted - only people with the room ID can find it"
      />

      <Button variant="contained" color="secondary" type="submit">
        Create
      </Button>
    </CreateRoomFormWrapper>
  )
}
