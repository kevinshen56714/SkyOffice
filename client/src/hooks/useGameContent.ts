import { useAppSelector } from '../hooks'
import { canSendMessages } from '../utils/meetingRoomPermissions'

/**
 * メインゲームコンテンツで使用される状態とロジックを管理
 * App.tsxのゲーム関連ロジックを分離
 */
export const useGameContent = () => {
  const isDevMode = useAppSelector((state) => state.devMode.isDevMode)
  const currentMeetingRoomId = useAppSelector((state) => state.chat.currentMeetingRoomId)
  const meetingRooms = useAppSelector((state) => state.meetingRoom.meetingRooms)
  const sessionId = useAppSelector((state) => state.user.sessionId)

  const currentRoom = currentMeetingRoomId 
    ? meetingRooms[currentMeetingRoomId] 
    : null

  const userCanSendMessages = currentRoom 
    ? canSendMessages(sessionId, currentRoom) 
    : false

  // Enhanced Debug logging
  console.log('🐛 [useGameContent] Full state debug:', {
    currentMeetingRoomId,
    meetingRoomsCount: Object.keys(meetingRooms).length,
    meetingRoomsArray: Object.values(meetingRooms).map(r => ({ id: r.id, name: r.name, mode: r.mode })),
    currentRoom: currentRoom ? { id: currentRoom.id, name: currentRoom.name } : null,
    userCanSendMessages,
    sessionId,
    shouldShowChat: !!(currentMeetingRoomId && currentRoom)
  })

  // Log every time meeting room ID changes
  if (currentMeetingRoomId) {
    console.log('🏠 [useGameContent] Meeting room ID detected:', currentMeetingRoomId)
    console.log('🔍 [useGameContent] Looking for room in:', Object.keys(meetingRooms))
  }

  return {
    isDevMode,
    currentMeetingRoomId,
    currentRoom,
    userCanSendMessages
  }
}