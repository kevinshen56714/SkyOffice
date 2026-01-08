import store from '../stores'
import { v4 as uuidv4 } from 'uuid'
import {
  addMeetingRoom,
  addMeetingRoomArea,
  MeetingRoom,
  MeetingRoomArea,
  MeetingRoomMode,
} from '../stores/MeetingRoomStore'

/**
 * 部屋エリアを作成し、Redux stateにMeetingRoomとMeetingRoomAreaを同時に追加する
 * @param name 部屋名
 * @param mode 'open' | 'private' | 'secret'
 * @param hostUserId ホストのユーザーID
 * @param x エリア左上X
 * @param y エリア左上Y
 * @param width エリア幅
 * @param height エリア高さ
 * @returns 作成したMeetingRoomとMeetingRoomArea
 */
export function createMeetingRoomWithArea(
  name: string,
  mode: MeetingRoomMode,
  hostUserId: string,
  x: number,
  y: number,
  width: number,
  height: number
) {

  const id = uuidv4();
  const room: MeetingRoom = {
    id,
    name,
    mode,
    hostUserId,
    invitedUsers: [],
    participants: [],
  };
  const area: MeetingRoomArea = {
    meetingRoomId: id,
    x, y, width, height
  };

  store.dispatch(addMeetingRoom(room));
  store.dispatch(addMeetingRoomArea(area));

  return { room, area };
}
