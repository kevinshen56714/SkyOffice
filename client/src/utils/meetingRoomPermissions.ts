import { MeetingRoom } from '../stores/MeetingRoomStore'

export const canAccessMeetingRoom = (userId: string, room: MeetingRoom): boolean => {
    if (room.mode === 'open') {
        return true
    } else if (room.mode === 'private') {
        return room.hostUserId === userId || room.invitedUsers.includes(userId)
    } else if (room.mode === 'secret') {
        return room.hostUserId === userId
    }
    return false
}

export const canSendMessages = (userId: string, room: MeetingRoom): boolean => {
    // For now, same as access permission
    // Can be extended for more granular control (e.g., read-only participants)
    return canAccessMeetingRoom(userId, room)
}

export const canViewMessages = (userId: string, room: MeetingRoom): boolean => {
    // For now, same as access permission
    return canAccessMeetingRoom(userId, room)
}

export const isHost = (userId: string, room: MeetingRoom): boolean => {
    return room.hostUserId === userId
}

export const isInvited = (userId: string, room: MeetingRoom): boolean => {
    return room.invitedUsers.includes(userId)
}

export const getUserRoleInRoom = (userId: string, room: MeetingRoom): 'host' | 'invited' | 'guest' | 'denied' => {
    if (isHost(userId, room)) {
        return 'host'
    }
    
    if (room.mode === 'open') {
        return 'guest'
    }
    
    if (room.mode === 'private') {
        return isInvited(userId, room) ? 'invited' : 'denied'
    }
    
    if (room.mode === 'secret') {
        return 'denied'
    }
    
    return 'denied'
}