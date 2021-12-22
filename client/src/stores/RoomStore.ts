import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RoomAvailable } from 'colyseus.js'

export interface RoomDisplayProps {
  roomId: string
  name: string
  description: string
  hasPassword: boolean
  clients: number
}

export const roomSlice = createSlice({
  name: 'room',
  initialState: {
    roomId: '',
    roomName: '',
    roomDescription: '',
    availableRooms: new Array<RoomAvailable>(),
  },
  reducers: {
    setJoinedRoomData: (
      state,
      action: PayloadAction<{ id: string; name: string; description: string }>
    ) => {
      state.roomId = action.payload.id
      state.roomName = action.payload.name
      state.roomDescription = action.payload.description
    },
    setAvailableRooms: (state, action: PayloadAction<RoomAvailable[]>) => {
      state.availableRooms = action.payload
    },
    addAvailableRooms: (state, action: PayloadAction<{ roomId: string; room: RoomAvailable }>) => {
      const roomIndex = state.availableRooms.findIndex(
        (room) => room.roomId === action.payload.roomId
      )
      if (roomIndex !== -1) {
        state.availableRooms[roomIndex] = action.payload.room
      } else {
        state.availableRooms.push(action.payload.room)
      }
    },
    removeAvailableRooms: (state, action: PayloadAction<string>) => {
      state.availableRooms = state.availableRooms.filter((room) => room.roomId !== action.payload)
    },
  },
})

export const { setJoinedRoomData, setAvailableRooms, addAvailableRooms, removeAvailableRooms } =
  roomSlice.actions

export default roomSlice.reducer
