import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type MeetingRoomMode = 'open' | 'private' | 'secret';

export interface MeetingRoom {
    id: string;
    name: string;
    mode: MeetingRoomMode;
    hostUserId: string;
    invitedUsers: string[];
    participants: string[];
}

export interface MeetingRoomArea{
    meetingRoomId: string;
    x: number;
    y: number;
    width: number;
    height: number;
}

interface MeetingRoomState {
    meetingRooms : Record<string, MeetingRoom>;
    currentMeetingRoomId: string | null;
    meetingRoomAreas: Record<string, MeetingRoomArea>;
}

const initialState: MeetingRoomState = {
    meetingRooms: {},
    currentMeetingRoomId: null,
    meetingRoomAreas: {},
};


export const meetingRoomSlice = createSlice({
    name: 'meetingRoom',
    initialState,
    reducers: {
        setMeetingRooms: (state, action: PayloadAction<Record<string, MeetingRoom>>) => {
            state.meetingRooms = action.payload;
        },
        addMeetingRoom: (state, action: PayloadAction<MeetingRoom>) => {
            state.meetingRooms[action.payload.id] = action.payload;
        },

        updateMeetingRoom: (state, action: PayloadAction<MeetingRoom>) => {
            if (state.meetingRooms[action.payload.id]) {
                state.meetingRooms[action.payload.id] = action.payload;
            }
        },
        removeMeetingRoom: (state, action: PayloadAction<string>) => {
            delete state.meetingRooms[action.payload];
        },

        setCurrentMeetingRoomId: (state, action: PayloadAction<string | null>) => {
            state.currentMeetingRoomId = action.payload;
        },
        addMeetingRoomArea: (state, action: PayloadAction<MeetingRoomArea>) => {
            state.meetingRoomAreas[action.payload.meetingRoomId] = action.payload;
        },
        updateMeetingRoomArea: (state, action: PayloadAction<MeetingRoomArea>) => {
            if (state.meetingRoomAreas[action.payload.meetingRoomId]) {
                state.meetingRoomAreas[action.payload.meetingRoomId] = action.payload;
            }
        },
        removeMeetingRoomArea: (state, action: PayloadAction<string>) => {
            delete state.meetingRoomAreas[action.payload];
        },

        // Server-specific actions for network sync
        addMeetingRoomFromServer: (state, action: PayloadAction<MeetingRoom>) => {
            state.meetingRooms[action.payload.id] = action.payload;
            console.log('📥 [MeetingRoomStore] Added room from server:', action.payload.id);
        },
        removeMeetingRoomFromServer: (state, action: PayloadAction<string>) => {
            delete state.meetingRooms[action.payload];
            console.log('📤 [MeetingRoomStore] Removed room from server:', action.payload);
        },
        addMeetingRoomAreaFromServer: (state, action: PayloadAction<MeetingRoomArea>) => {
            state.meetingRoomAreas[action.payload.meetingRoomId] = action.payload;
            console.log('📥 [MeetingRoomStore] Added area from server:', action.payload.meetingRoomId);
        },
        removeMeetingRoomAreaFromServer: (state, action: PayloadAction<string>) => {
            delete state.meetingRoomAreas[action.payload];
            console.log('📤 [MeetingRoomStore] Removed area from server:', action.payload);
        },

    }
});

export const {
    setMeetingRooms,
    addMeetingRoom,
    updateMeetingRoom,
    removeMeetingRoom,
    setCurrentMeetingRoomId,
    addMeetingRoomArea,
    updateMeetingRoomArea,
    removeMeetingRoomArea,
    addMeetingRoomFromServer,
    removeMeetingRoomFromServer,
    addMeetingRoomAreaFromServer,
    removeMeetingRoomAreaFromServer,
} = meetingRoomSlice.actions;

export default meetingRoomSlice.reducer;

