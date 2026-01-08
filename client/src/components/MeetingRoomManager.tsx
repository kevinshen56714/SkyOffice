import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import {
    updateMeetingRoom,
    updateMeetingRoomArea,
    MeetingRoom,
    MeetingRoomArea,
} from '../stores/MeetingRoomStore';

import type { RootState } from '../stores';

const MeetingRoomEditor: React.FC<{ room: MeetingRoom; area: MeetingRoomArea | undefined }> = ({
    room,
    area,
}) => {
    const dispatch = useDispatch();
    const [mode, setMode] = useState(room.mode);
    const [hostUserId, setHostUserId] = useState(room.hostUserId);
    const [invitedUsers, setInvitedUsers] = useState<string[]>(room.invitedUsers);
    const [areaVals, setAreaVals] = useState({
        x: area?.x ?? 0,
        y: area?.y ?? 0,
        width: area?.width ?? 100,
        height: area?.height ?? 100,
    });
    const currentUserId = useSelector((state: RootState) => state.user.sessionId);
    console.log("currentUserId", currentUserId);
    const allUsers = [
        { id :currentUserId, name: currentUserId },
    ];
    const handleSave = () => {
        dispatch(
            updateMeetingRoom({
                ...room,
                mode,
                hostUserId,
                invitedUsers,
            })
        );
        dispatch(
            updateMeetingRoomArea({
                meetingRoomId: room.id,
                ...areaVals,
            })
        );
        alert("保存しました");
    };

    const handleInvitedUserChange = (id: string, checked: boolean) => {
        setInvitedUsers((prev) =>
            checked ? [...prev, id] : prev.filter((uid) => uid !== id)
        );
    };

    // 参加者表示
    const participantNames = room.participants
        .map((id) => allUsers.find((u) => u.id === id)?.name || id)
        .join(", ");

    return (
        <div style={{ border: "1px solid #888", padding: 16, marginBottom: 24 ,width: 400, backgroundColor: "aqua"}}>
            <h2>{room.name}</h2>
            <div>
                <label>
                    mode:
                    <select value={mode} onChange={(e) => setMode(e.target.value as any)}>
                        <option value="open">open</option>
                        <option value="private">private</option>
                        <option value="secret">secret</option>
                    </select>
                </label>
            </div>
            <div>
                <label>
                    user:
                    <select value={hostUserId} onChange={(e) => setHostUserId(e.target.value)}>
                        {allUsers.map((u) => (
                            <option value={u.id} key={u.id}>
                                {u.name}
                            </option>
                        ))}
                    </select>
                </label>
            </div>
            <div>
                <label>invite:</label>
                {allUsers.map((u) => (
                    <label key={u.id} style={{ marginLeft: 8 }}>
                        <input
                            type="checkbox"
                            checked={invitedUsers.includes(u.id)}
                            onChange={(e) => handleInvitedUserChange(u.id, e.target.checked)}
                            disabled={u.id === hostUserId}
                        />
                        {u.name}
                    </label>
                ))}
            </div>
            <div>
                <label>
                    Area:
                    <input
                        type="number"
                        value={areaVals.x}
                        onChange={e => setAreaVals(v => ({ ...v, x: +e.target.value }))}
                        style={{ width: 60, marginLeft: 4 }}
                        placeholder="x"
                    />
                    <input
                        type="number"
                        value={areaVals.y}
                        onChange={e => setAreaVals(v => ({ ...v, y: +e.target.value }))}
                        style={{ width: 60 }}
                        placeholder="y"
                    />
                    <input
                        type="number"
                        value={areaVals.width}
                        onChange={e => setAreaVals(v => ({ ...v, width: +e.target.value }))}
                        style={{ width: 60 }}
                        placeholder="width"
                    />
                    <input
                        type="number"
                        value={areaVals.height}
                        onChange={e => setAreaVals(v => ({ ...v, height: +e.target.value }))}
                        style={{ width: 60 }}
                        placeholder="height"
                    />
                </label>
            </div>
            <div>
                <label>inviteUsers: {invitedUsers.join(", ") || "none"}</label>
            </div>
            <div>
                <label>participant: {participantNames || "none"}</label>
            </div>
            <button type="button" onClick={handleSave}>
                save
            </button>
        </div>
    );
};

const MeetingRoomManager: React.FC = () => {
  const rooms = useSelector((state: RootState) => state.meetingRoom.meetingRooms);
  const areas = useSelector((state: RootState) => state.meetingRoom.meetingRoomAreas);

  if (Object.keys(rooms).length === 0) return <div>会議室がありません</div>;

  return (
    <div>
      <h1>MeetingRoomEditor</h1>
      {Object.values(rooms).map(room => (
        <MeetingRoomEditor
          key={room.id}
          room={room}
          area={areas[room.id]}
        />
      ))}
    </div>
  );
};

export default MeetingRoomManager;
