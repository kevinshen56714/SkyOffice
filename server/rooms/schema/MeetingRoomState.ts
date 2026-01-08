import { Schema, type, MapSchema, ArraySchema } from '@colyseus/schema'

export type MeetingRoomMode = 'open' | 'private' | 'secret'

export class MeetingRoomChatMessage extends Schema {
    @type('string') author: string = ''
    @type('number') createdAt: number = 0
    @type('string') content: string = ''
    @type('string') meetingRoomId: string = ''
    @type('string') messageId: string = ''
}

export class MeetingRoom extends Schema {
    @type('string') id: string = ''
    @type('string') name: string = ''
    @type('string') mode: MeetingRoomMode = 'open' // Default mode is 'open'
    @type('string') hostUserId: string = ''
    @type(['string']) invitedUsers = new ArraySchema<string>()
    @type(['string']) participants = new ArraySchema<string>()
}

export class MeetingRoomArea extends Schema {
    @type('string') meetingRoomId: string = ''
    @type('number') x: number = 0
    @type('number') y: number = 0
    @type('number') width: number = 100
    @type('number') height: number = 100
}

export class MeetingRoomState extends Schema {
    @type({ map: MeetingRoom }) meetingRooms = new MapSchema<MeetingRoom>()
    @type({ map: MeetingRoomArea }) meetingRoomAreas = new MapSchema<MeetingRoomArea>()
    @type([MeetingRoomChatMessage]) meetingRoomChatMessages = new ArraySchema<MeetingRoomChatMessage>()
}
