import React, { useState, useEffect } from 'react'
import phaserGame from '../PhaserGame'
import Game from '../scenes/Game'
import {
  Box,
  Paper,
  Typography,
  Button,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Grid,
  Switch,
  FormControlLabel,
  Divider,
  IconButton,
  Autocomplete
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import { useAppSelector, useAppDispatch } from '../hooks'
import { useDevMode } from '../hooks/useDevMode'
import { LogLevel, LogEntry } from '../utils/logger'
import { BackgroundMode } from '../../../types/BackgroundMode'
import { BaseAvatarType } from '../types/AvatarTypes'
import { startWork, endWork, startBreak, endBreak, setWorkStartTime, setFatigueLevel, updateWorkStatus, updateOtherPlayerWorkStatus, setBaseAvatar } from '../stores/WorkStore'
import { toggleBackgroundMode, setVideoConnected, setLoggedIn, setShowJoystick, setPlayerNameMap } from '../stores/UserStore'
import { setDevmode } from '../stores/DevModeStore'
import { setLobbyJoined, setRoomJoined, setJoinedRoomData } from '../stores/RoomStore'
import { setShowChat, setFocused, pushChatMessage, setCurrentMeetingRoomId } from '../stores/ChatStore'
import { openComputerDialog, closeComputerDialog } from '../stores/ComputerStore'
import { openWhiteboardDialog, closeWhiteboardDialog } from '../stores/WhiteboardStore'
import { addMeetingRoom, updateMeetingRoom, removeMeetingRoom, addMeetingRoomArea, updateMeetingRoomArea, removeMeetingRoomArea, setCurrentMeetingRoomId as setMeetingRoomId, MeetingRoomMode } from '../stores/MeetingRoomStore'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index}>
    {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
  </div>
)

const DevModePanel: React.FC = () => {
  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  const { isDevMode, logManager, setLogLevel } = useDevMode()
  const dispatch = useAppDispatch()
  
  // Helper function to get network connection
  const getNetwork = () => {
    try {
      console.log('🔍 [DevMode] Getting network connection...')
      console.log('🔍 [DevMode] phaserGame:', phaserGame)
      console.log('🔍 [DevMode] phaserGame.scene:', phaserGame?.scene)
      console.log('🔍 [DevMode] phaserGame.scene.keys:', phaserGame?.scene?.keys)
      
      const game = phaserGame.scene.keys.game as Game
      console.log('🔍 [DevMode] game object:', game)
      console.log('🔍 [DevMode] game.network:', game?.network)
      
      if (game?.network) {
        console.log('✅ [DevMode] Network connection found')
        return game.network
      } else {
        console.warn('❌ [DevMode] Network connection not found')
        return null
      }
    } catch (error) {
      console.error('🌐 [DevMode] Failed to get network connection:', error)
      return null
    }
  }
  
  // Get Redux state - ALWAYS call these hooks
  const workState = useAppSelector((state) => state.work)
  const userState = useAppSelector((state) => state.user)
  const roomState = useAppSelector((state) => state.room)
  const chatState = useAppSelector((state) => state.chat)
  const computerState = useAppSelector((state) => state.computer)
  const whiteboardState = useAppSelector((state) => state.whiteboard)
  const meetingRoomState = useAppSelector((state) => state.meetingRoom)
  
  // Get online players from playerNameMap
  const onlinePlayers = React.useMemo(() => {
    const players: { id: string, name: string }[] = []
    console.log('🎮 [DevMode] playerNameMap:', userState.playerNameMap)
    console.log('🎮 [DevMode] playerNameMap size:', userState.playerNameMap.size)
    console.log('🎮 [DevMode] sessionId:', userState.sessionId)
    
    // Iterate over Map entries
    for (const [id, name] of userState.playerNameMap.entries()) {
      console.log('🎮 [DevMode] Processing player:', { id, name, isMe: id === userState.sessionId })
      if (id !== userState.sessionId) { // Exclude self
        players.push({ id, name })
        console.log('🎮 [DevMode] Added to onlinePlayers:', { id, name })
      } else {
        console.log('🎮 [DevMode] Skipped self:', { id, name })
      }
    }
    
    console.log('🎮 [DevMode] Final onlinePlayers:', players)
    return players.sort((a, b) => a.name.localeCompare(b.name))
  }, [userState.playerNameMap, userState.sessionId])
  
  // Panel state - ALWAYS call these hooks
  const [tabValue, setTabValue] = useState(0)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [logFilter, setLogFilter] = useState<LogLevel | 'all'>('all')
  const [componentFilter, setComponentFilter] = useState<string>('all')
  const [mockWorkTime, setMockWorkTime] = useState<string>('')
  const [mockFatigue, setMockFatigue] = useState<number>(0)
  
  // State editing - ALWAYS call these hooks
  const [editMode, setEditMode] = useState<{ [key: string]: boolean }>({})
  const [editValues, setEditValues] = useState<{ [key: string]: any }>({})
  
  // Meeting Room management - ALWAYS call these hooks
  const [newRoomName, setNewRoomName] = useState('')
  const [newRoomMode, setNewRoomMode] = useState<MeetingRoomMode>('open')
  const [newRoomArea, setNewRoomArea] = useState({ x: 100, y: 100, width: 150, height: 100 })
  
  // Room editing states - ALWAYS call these hooks
  const [expandedRoom, setExpandedRoom] = useState<string | null>(null)
  const [editingRooms, setEditingRooms] = useState<{ [roomId: string]: { 
    name: string
    area: { x: number, y: number, width: number, height: number }
    invitedUsers: string[]
  } }>({})
  
  // Visual editing mode - ALWAYS call this hook
  const [visualEditMode, setVisualEditMode] = useState(false)

  // Monitor logs
  useEffect(() => {
    const updateLogs = () => setLogs(logManager.getLogs())
    
    logManager.addListener(updateLogs)
    updateLogs()
    
    return () => logManager.removeListener(updateLogs)
  }, [logManager])

  // Expose visual edit functions globally for game scene access
  useEffect(() => {
    const updateRoomAreaFromVisual = (roomId: string, area: { x: number, y: number, width: number, height: number }) => {
      console.log(`🎨 [DevMode] updateRoomAreaFromVisual called:`, { roomId, area })
      
      // Update Redux store
      const room = meetingRoomState.meetingRooms[roomId]
      if (!room) {
        console.error(`🎨 [DevMode] Room not found:`, roomId)
        return
      }

      const currentArea = meetingRoomState.meetingRoomAreas[roomId]
      console.log(`🎨 [DevMode] Current area:`, currentArea)

      const updatedArea = {
        meetingRoomId: roomId,
        ...area
      }

      console.log(`🎨 [DevMode] Dispatching updateMeetingRoomArea with:`, updatedArea)
      dispatch(updateMeetingRoomArea(updatedArea))

      // Send to network
      const network = getNetwork()
      if (network) {
        console.log(`🎨 [DevMode] Sending to network:`, { roomId, areaUpdates: area })
        network.updateMeetingRoomArea(roomId, area)
      } else {
        console.warn(`🎨 [DevMode] Network not available`)
      }
      
      console.log(`🎨 [DevMode] Updated room area visually completed:`, { roomId, area })
    }

    // Global function no longer needed - Game.ts uses direct Redux/Network access
    return () => {
      // Cleanup if needed
    }
  }, [meetingRoomState, dispatch])

  // Now that ALL hooks have been called, we can do conditional rendering
  if (!isDevMode) {
    return (
      <Button
        variant="contained"
        color="secondary"
        size="small"
        onClick={() => dispatch(setDevmode(true))}
        sx={{
          position: 'fixed',
          top: 20,
          right: 20,
          zIndex: 9999,
          fontSize: '10px'
        }}
      >
        🛠️ Enable DevMode
      </Button>
    )
  }

  // Filtered logs
  const filteredLogs = logs.filter(log => {
    if (logFilter !== 'all' && log.level !== logFilter) return false
    if (componentFilter !== 'all' && log.component !== componentFilter) return false
    return true
  })

  // Component list
  const components = ['all', ...Array.from(new Set(logs.map(log => log.component)))]

  // Mock operation functions
  const handleMockWorkStart = () => {
    const startTime = mockWorkTime ? new Date(mockWorkTime).getTime() : Date.now()
    dispatch(setWorkStartTime(startTime))
    dispatch(startWork())
  }

  const handleSetFatigue = () => {
    dispatch(setFatigueLevel(mockFatigue))
  }

  // Add other player
  const addMockPlayer = () => {
    const mockPlayerId = `mock_player_${Date.now()}`
    const mockPlayerName = `TestPlayer${Math.floor(Math.random() * 100)}`
    const statuses = ['working', 'break', 'meeting', 'off-duty'] as const
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)]
    
    console.log('🤖 [DevMode] Adding mock player to playerNameMap:', { id: mockPlayerId, name: mockPlayerName })
    
    // Add to playerNameMap for invitation testing
    dispatch(setPlayerNameMap({ id: mockPlayerId, name: mockPlayerName }))
    
    // Add to work status for testing
    dispatch(updateOtherPlayerWorkStatus({
      playerId: mockPlayerId,
      playerName: mockPlayerName,
      workStatus: randomStatus
    }))
  }

  // Network sync test
  const testNetworkSync = () => {
    console.log('🔄 [DevMode] Testing network sync...')
    console.log('Current other players:', workState.otherPlayersWorkStatus)
    console.log('Network connection:', getNetwork() ? 'Connected' : 'Disconnected')
    console.log('User state:', {
      sessionId: userState.sessionId,
      loggedIn: userState.loggedIn,
      playerNameMap: userState.playerNameMap
    })
    
    // Check all currently existing players
    Object.entries(workState.otherPlayersWorkStatus).forEach(([playerId, playerData]) => {
      console.log(`Player ${playerId}:`, playerData)
      console.log(`  - Name: ${playerData.playerName}`)
      console.log(`  - Status: ${playerData.workStatus}`) 
      console.log(`  - Last Updated: ${new Date(playerData.lastUpdated).toLocaleString()}`)
    })
    
    // Test work status message reception from network
    console.log('📡 [DevMode] Checking for work-status message listeners...')
    const network = getNetwork()
    if (network && network.room) {
      console.log('✅ Network room is available')
      console.log('🎧 Message listeners count:', Object.keys(network.room._messageHandlers || {}).length)
      console.log('📋 Available message types:', Object.keys(network.room._messageHandlers || {}))
      
      // Manually test work-status-changed message
      if (Object.keys(workState.otherPlayersWorkStatus).length > 0) {
        const firstPlayerId = Object.keys(workState.otherPlayersWorkStatus)[0]
        const testMessage = {
          playerId: firstPlayerId,
          playerName: workState.otherPlayersWorkStatus[firstPlayerId].playerName,
          workStatus: 'working'
        }
        console.log('🧪 [DevMode] Simulating work-status-changed message:', testMessage)
      }
    } else {
      console.error('❌ Network room is not available')
    }
  }

  // Force change other player status (for testing)
  const simulateOtherPlayerStatusChange = () => {
    const playerIds = Object.keys(workState.otherPlayersWorkStatus)
    if (playerIds.length === 0) {
      console.warn('⚠️ No other players to test with')
      return
    }
    
    const testPlayerId = playerIds[0]
    const player = workState.otherPlayersWorkStatus[testPlayerId]
    const statuses = ['working', 'break', 'meeting', 'off-duty'] as const
    const currentIndex = statuses.indexOf(player.workStatus as any)
    const nextStatus = statuses[(currentIndex + 1) % statuses.length]
    
    console.log(`🧪 [DevMode] Simulating status change for ${player.playerName}: ${player.workStatus} → ${nextStatus}`)
    
    // Directly update Redux state (simulate message from server)
    dispatch(updateOtherPlayerWorkStatus({
      playerId: testPlayerId,
      playerName: player.playerName,
      workStatus: nextStatus
    }))
  }

  // Change own work status and test network transmission
  const testSendWorkStatus = () => {
    const network = getNetwork()
    if (!network) {
      console.error('❌ Network not available')
      return
    }
    
    const currentStatus = workState.currentWorkStatus
    const newStatus = currentStatus === 'working' ? 'break' : 'working'
    
    console.log(`📤 [DevMode] Testing work status send: ${currentStatus} → ${newStatus}`)
    
    // Change own status and send to server
    if (newStatus === 'working') {
      dispatch(startWork())
      network.startWork?.()
    } else {
      dispatch(startBreak())
      network.startBreak?.()
    }
    
    console.log('✅ [DevMode] Work status change sent to server')
  }

  // State editing helper functions
  const startEdit = (field: string, currentValue: any) => {
    setEditMode(prev => ({ ...prev, [field]: true }))
    setEditValues(prev => ({ ...prev, [field]: currentValue }))
  }

  const cancelEdit = (field: string) => {
    setEditMode(prev => ({ ...prev, [field]: false }))
    setEditValues(prev => ({ ...prev, [field]: undefined }))
  }

  const saveEdit = (field: string) => {
    const value = editValues[field]
    
    switch (field) {
      // Work Store fields
      case 'workStatus':
        dispatch(updateWorkStatus({ workStatus: value as any }))
        // Update MyPlayer sprite after work status change
        setTimeout(() => {
          const game = (window as any).game
          if (game?.myPlayer) {
            game.myPlayer.updateAvatarFromWorkState()
          }
        }, 0)
        break
      case 'workStartTime':
        dispatch(setWorkStartTime(new Date(value).getTime()))
        break
      case 'fatigueLevel':
        dispatch(setFatigueLevel(Number(value)))
        // Update MyPlayer sprite after fatigue level change
        setTimeout(() => {
          const game = (window as any).game
          if (game?.myPlayer) {
            game.myPlayer.updateAvatarFromWorkState()
          }
        }, 0)
        break
      case 'currentClothing':
        dispatch(updateWorkStatus({ workStatus: workState.currentWorkStatus, clothing: value }))
        break
      case 'currentAccessory':
        dispatch(updateWorkStatus({ workStatus: workState.currentWorkStatus, accessory: value }))
        break
        
      // Room Store fields
      case 'roomId':
      case 'roomName':
      case 'roomDescription':
        dispatch(setJoinedRoomData({
          id: field === 'roomId' ? value : roomState.roomId,
          name: field === 'roomName' ? value : roomState.roomName,
          description: field === 'roomDescription' ? value : roomState.roomDescription
        }))
        break
        
      default:
        console.warn(`Unknown field: ${field}`)
    }
    
    setEditMode(prev => ({ ...prev, [field]: false }))
    setEditValues(prev => ({ ...prev, [field]: undefined }))
  }

  // Editable field renderer
  const renderEditableField = (field: string, label: string, currentValue: any, type: 'text' | 'number' | 'select' = 'text', options?: string[]) => {
    const isEditing = editMode[field]
    const editValue = editValues[field]
    
    // Debug log for select fields
    if (type === 'select') {
      console.log(`🔍 [DevMode] Rendering select field: ${field}`, {
        options,
        optionsLength: options?.length,
        currentValue,
        editValue,
        isEditing
      })
    }

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        <Typography sx={{ fontSize: '12px', minWidth: '80px' }}>{label}:</Typography>
        
        {isEditing ? (
          <>
            {type === 'select' && options ? (
              <Select
                size="small"
                value={editValue}
                onChange={(e) => {
                  console.log(`🔧 [DevMode] Select changed: ${field} = ${e.target.value}`)
                  setEditValues(prev => ({ ...prev, [field]: e.target.value }))
                }}
                sx={{ fontSize: '10px', minWidth: '100px' }}
                MenuProps={{ sx: { zIndex: 10000 } }}
              >
                {options.map((option, index) => {
                  console.log(`🔍 [DevMode] Creating MenuItem: ${index} = ${option}`)
                  return (
                    <MenuItem key={option} value={option}>{option}</MenuItem>
                  )
                })}
              </Select>
            ) : (
              <TextField
                size="small"
                type={type === 'number' ? 'number' : type === 'text' ? 'text' : 'datetime-local'}
                value={editValue}
                onChange={(e) => setEditValues(prev => ({ ...prev, [field]: e.target.value }))}
                sx={{ fontSize: '10px', minWidth: '100px' }}
              />
            )}
            <Button size="small" onClick={() => saveEdit(field)} sx={{ minWidth: '30px', fontSize: '8px' }}>✓</Button>
            <Button size="small" onClick={() => cancelEdit(field)} sx={{ minWidth: '30px', fontSize: '8px' }}>✗</Button>
          </>
        ) : (
          <>
            <Typography sx={{ fontSize: '12px', fontFamily: 'monospace', flex: 1 }}>
              {currentValue}
            </Typography>
            <Button 
              size="small" 
              onClick={() => startEdit(field, currentValue)} 
              sx={{ minWidth: '30px', fontSize: '8px' }}
            >
              ✏️
            </Button>
          </>
        )}
      </Box>
    )
  }

  // Meeting Room management functions
  const generateRoomId = () => `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  const createMeetingRoom = () => {
    if (!newRoomName.trim()) return
    
    const roomId = generateRoomId()
    const room = {
      id: roomId,
      name: newRoomName,
      mode: newRoomMode,
      hostUserId: userState.sessionId || 'unknown',
      invitedUsers: [],
      participants: []
    }
    
    const area = {
      meetingRoomId: roomId,
      ...newRoomArea
    }
    
    dispatch(addMeetingRoom(room))
    dispatch(addMeetingRoomArea(area))
    
    // Send to network if available
    const network = getNetwork()
    if (network) {
      network.createMeetingRoom({
        id: roomId,
        name: newRoomName,
        mode: newRoomMode,
        hostUserId: userState.sessionId || 'unknown',
        invitedUsers: [],
        area: newRoomArea
      })
    }
    
    // Reset form
    setNewRoomName('')
    setNewRoomMode('open')
    setNewRoomArea({ x: 100, y: 100, width: 150, height: 100 })
  }

  const deleteMeetingRoom = (roomId: string) => {
    console.log('🗑️ [DevMode] ===== DELETE MEETING ROOM START =====')
    console.log('🗑️ [DevMode] Room ID to delete:', roomId)
    
    // Check if room exists before deletion
    const roomExists = meetingRoomState.meetingRooms[roomId]
    const areaExists = meetingRoomState.meetingRoomAreas[roomId]
    console.log('🗑️ [DevMode] Room exists in state:', !!roomExists)
    console.log('🗑️ [DevMode] Area exists in state:', !!areaExists)
    
    // Remove from local Redux state
    console.log('🗑️ [DevMode] Step 1: Removing from Redux state...')
    dispatch(removeMeetingRoom(roomId))
    dispatch(removeMeetingRoomArea(roomId))
    console.log('🗑️ [DevMode] Redux state update dispatched')
    
    // Send to network if available
    console.log('🗑️ [DevMode] Step 2: Getting network connection...')
    const network = getNetwork()
    if (network) {
      console.log('🗑️ [DevMode] Step 3: Sending delete request to server...')
      console.log('🗑️ [DevMode] Network object methods:', Object.getOwnPropertyNames(network))
      console.log('🗑️ [DevMode] Has deleteMeetingRoom method:', typeof network.deleteMeetingRoom)
      
      try {
        network.deleteMeetingRoom(roomId)
        console.log('🗑️ [DevMode] Delete request sent successfully')
      } catch (error) {
        console.error('🗑️ [DevMode] Error sending delete request:', error)
      }
    } else {
      console.warn('🗑️ [DevMode] Network not available for room deletion')
    }
    
    console.log('🗑️ [DevMode] ===== DELETE MEETING ROOM END =====')
  }

  const updateRoomMode = (roomId: string, newMode: MeetingRoomMode) => {
    console.log('🏢 [DevMode] updateRoomMode called:', { roomId, newMode })
    
    const room = meetingRoomState.meetingRooms[roomId]
    if (!room) {
      console.error('🏢 [DevMode] Room not found:', roomId)
      return
    }
    
    console.log('🏢 [DevMode] Current room:', room)
    const updatedRoom = { ...room, mode: newMode }
    console.log('🏢 [DevMode] Updated room:', updatedRoom)
    
    const area = meetingRoomState.meetingRoomAreas[roomId]
    
    if (area) {
      console.log('🏢 [DevMode] Dispatching updateMeetingRoom to Redux')
      dispatch(updateMeetingRoom(updatedRoom))
      
      // Send to network if available
      const network = getNetwork()
      if (network) {
        console.log('🏢 [DevMode] Sending to network:', {
          id: roomId,
          name: room.name,
          mode: newMode,
          hostUserId: room.hostUserId,
          invitedUsers: room.invitedUsers
        })
        network.updateMeetingRoom({
          id: roomId,
          name: room.name,
          mode: newMode,
          hostUserId: room.hostUserId,
          invitedUsers: room.invitedUsers
        })
      } else {
        console.warn('🏢 [DevMode] Network not available on window object')
      }
    } else {
      console.error('🏢 [DevMode] Area not found for room:', roomId)
    }
  }

  // Room editing functions
  const startRoomEdit = (room: any, area: any) => {
    setEditingRooms(prev => ({
      ...prev,
      [room.id]: {
        name: room.name,
        area: {
          x: area?.x || 0,
          y: area?.y || 0,
          width: area?.width || 100,
          height: area?.height || 100
        },
        invitedUsers: room.invitedUsers || []
      }
    }))
  }

  const saveRoomEdit = (roomId: string) => {
    const editing = editingRooms[roomId]
    if (!editing) return

    const room = meetingRoomState.meetingRooms[roomId]
    if (!room) return

    const updatedRoom = {
      ...room,
      name: editing.name,
      invitedUsers: editing.invitedUsers
    }

    const updatedArea = {
      meetingRoomId: roomId,
      ...editing.area
    }

    dispatch(updateMeetingRoom(updatedRoom))
    dispatch(updateMeetingRoomArea(updatedArea))

    // Send to network
    const network = getNetwork()
    if (network) {
      network.updateMeetingRoom({
        id: roomId,
        name: editing.name,
        mode: room.mode,
        hostUserId: room.hostUserId,
        invitedUsers: updatedRoom.invitedUsers,
        area: editing.area
      })
    }

    // Clear editing state
    setEditingRooms(prev => {
      const { [roomId]: _, ...rest } = prev
      return rest
    })
  }

  const cancelRoomEdit = (roomId: string) => {
    setEditingRooms(prev => {
      const { [roomId]: _, ...rest } = prev
      return rest
    })
  }

  const updateRoomEdit = (roomId: string, field: string, value: any) => {
    setEditingRooms(prev => ({
      ...prev,
      [roomId]: {
        ...prev[roomId],
        [field]: value
      }
    }))
  }

  const updateRoomAreaEdit = (roomId: string, field: string, value: number) => {
    setEditingRooms(prev => ({
      ...prev,
      [roomId]: {
        ...prev[roomId],
        area: {
          ...prev[roomId].area,
          [field]: value
        }
      }
    }))
  }

  const addInvitedUser = (roomId: string, userId: string) => {
    setEditingRooms(prev => ({
      ...prev,
      [roomId]: {
        ...prev[roomId],
        invitedUsers: [...prev[roomId].invitedUsers, userId]
      }
    }))
  }

  const removeInvitedUser = (roomId: string, userId: string) => {
    setEditingRooms(prev => ({
      ...prev,
      [roomId]: {
        ...prev[roomId],
        invitedUsers: prev[roomId].invitedUsers.filter(id => id !== userId)
      }
    }))
  }

  // Visual editing mode functions
  const toggleVisualEditMode = () => {
    console.log('🎯 [DevMode] toggleVisualEditMode called, current state:', visualEditMode)
    const newEditMode = !visualEditMode
    setVisualEditMode(newEditMode)
    
    // Send visual edit mode to game scene
    const game = (window as any).game
    console.log('🎯 [DevMode] Game object:', game)
    console.log('🎯 [DevMode] Game object keys:', Object.keys(game || {}))
    console.log('🎯 [DevMode] Game.scene:', game?.scene)
    console.log('🎯 [DevMode] Game.scene keys:', Object.keys(game?.scene || {}))
    
    // Try different ways to access the game scene
    let gameScene = null
    
    // Method 1: Check if game IS the scene
    if (game && (game as any).toggleMeetingRoomEditMode) {
      console.log('🎯 [DevMode] Method 1: Game object is the scene')
      gameScene = game
    }
    // Method 2: Check game.scene.scenes
    else if (game?.scene?.scenes) {
      console.log('🎯 [DevMode] Method 2: Using game.scene.scenes')
      console.log('🎯 [DevMode] Available scenes:', game.scene.scenes.map((s: any) => s.scene?.key || s.key || 'unknown'))
      gameScene = game.scene.scenes.find((s: any) => (s.scene?.key === 'game' || s.key === 'game'))
    }
    // Method 3: Check game.scene directly
    else if (game?.scene && (game.scene as any).toggleMeetingRoomEditMode) {
      console.log('🎯 [DevMode] Method 3: Using game.scene directly')
      gameScene = game.scene
    }
    // Method 4: Check if scene manager exists differently
    else if (game?.scene?.getScene) {
      console.log('🎯 [DevMode] Method 4: Using getScene method')
      gameScene = game.scene.getScene('game')
    }
    
    console.log('🎯 [DevMode] Found game scene:', gameScene)
    console.log('🎯 [DevMode] Game scene keys:', Object.keys(gameScene || {}))
    
    if (gameScene && (gameScene as any).toggleMeetingRoomEditMode) {
      console.log('🎯 [DevMode] Calling toggleMeetingRoomEditMode with:', newEditMode)
      ;(gameScene as any).toggleMeetingRoomEditMode(newEditMode)
    } else {
      console.warn('🎯 [DevMode] toggleMeetingRoomEditMode not found on game scene')
      console.warn('🎯 [DevMode] Available methods on scene:', Object.keys(gameScene || {}))
    }
    
    console.log(`🎨 [DevMode] Visual edit mode: ${newEditMode ? 'ENABLED' : 'DISABLED'}`)
  }


  return (
    <Paper
      elevation={3}
      sx={{
        position: 'fixed',
        top: 20,
        right: 20,
        width: 500,
        maxHeight: '90vh',
        overflow: 'auto',
        zIndex: 9999,
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(10px)',
        border: '2px solid #f44336'
      }}
    >
      <Box sx={{ borderBottom: 1, borderColor: 'divider', p: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ color: '#f44336', fontWeight: 'bold' }}>
            🛠️ DevMode Panel (Tab: {tabValue})
          </Typography>
          <Button 
            size="small" 
            onClick={() => setTabValue(2)}
            variant={tabValue === 2 ? 'contained' : 'outlined'}
            sx={{ fontSize: '8px', minWidth: '50px' }}
          >
            🏢 Room
          </Button>
        </Box>
        <Tabs 
          value={tabValue} 
          onChange={(_, newValue) => setTabValue(newValue)} 
          variant="scrollable" 
          scrollButtons="auto"
          sx={{ 
            '& .MuiTab-root': { 
              fontSize: '10px', 
              minWidth: '60px',
              padding: '6px 8px'
            }
          }}
        >
          <Tab label="Work" />
          <Tab label="User" />
          <Tab label="Room" />
          <Tab label="Chat" />
          <Tab label="Features" />
          <Tab label="Mock" />
          <Tab label="Logs" />
        </Tabs>
      </Box>

      {/* Work State Tab */}
      <TabPanel value={tabValue} index={0}>
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle2">💼 Work Status</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box>
              {renderEditableField(
                'workStatus', 
                'Status', 
                workState.currentWorkStatus,
                'select',
                ['off-duty', 'working', 'break', 'meeting', 'overtime']
              )}
              {renderEditableField(
                'workStartTime',
                'Start Time',
                workState.workStartTime ? new Date(workState.workStartTime).toISOString().slice(0, 16) : '',
                'text'
              )}
              {renderEditableField(
                'fatigueLevel',
                'Fatigue',
                workState.fatigueLevel,
                'number'
              )}
            </Box>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle2">🎭 Avatar & Appearance</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography sx={{ fontSize: '12px', minWidth: '80px' }}>Base Avatar:</Typography>
                <Select 
                  size="small"
                  value={workState.baseAvatar}
                  onChange={(e) => {
                    const newAvatar = e.target.value as BaseAvatarType
                    dispatch(setBaseAvatar(newAvatar))
                    // Update MyPlayer sprite after state update
                    setTimeout(() => {
                      const game = (window as any).game
                      if (game?.myPlayer) {
                        game.myPlayer.updateAvatarFromWorkState()
                      }
                    }, 0)
                  }}
                  sx={{ fontSize: '10px', minWidth: '100px' }}
                  MenuProps={{ sx: { zIndex: 10000 } }}
                >
                  <MenuItem value="adam">Adam</MenuItem>
                  <MenuItem value="ash">Ash</MenuItem>
                  <MenuItem value="lucy">Lucy</MenuItem>
                  <MenuItem value="nancy">Nancy</MenuItem>
                </Select>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography sx={{ fontSize: '12px', minWidth: '80px' }}>Current Sprite:</Typography>
                <Typography sx={{ fontSize: '12px', fontFamily: 'monospace', fontWeight: 'bold', color: 'primary.main' }}>
                  {workState.currentAvatarSprite}
                </Typography>
              </Box>
              
              {renderEditableField(
                'currentClothing',
                'Clothing',
                workState.currentClothing,
                'select',
                ['business', 'casual', 'tired']
              )}
              {renderEditableField(
                'currentAccessory',
                'Accessory',
                workState.currentAccessory,
                'select',
                ['coffee', 'documents', 'none']
              )}
            </Box>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle2">👥 Other Players</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography sx={{ fontSize: '12px', color: 'grey.600', mb: 1 }}>
              Players: {Object.keys(workState.otherPlayersWorkStatus).length}
            </Typography>
            {Object.entries(workState.otherPlayersWorkStatus).map(([playerId, player]) => (
              <Box key={playerId} sx={{ mb: 1, p: 1, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 1 }}>
                <Typography sx={{ fontSize: '10px', fontWeight: 'bold' }}>{player.playerName}</Typography>
                <Typography sx={{ fontSize: '9px', color: 'grey.600' }}>
                  Status: {player.workStatus} | Updated: {new Date(player.lastUpdated).toLocaleTimeString()}
                </Typography>
              </Box>
            ))}
          </AccordionDetails>
        </Accordion>
      </TabPanel>

      {/* User State Tab */}
      <TabPanel value={tabValue} index={1}>
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle2">👤 User Settings</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography sx={{ fontSize: '12px', minWidth: '80px' }}>Background:</Typography>
                <Button 
                  size="small" 
                  onClick={() => dispatch(toggleBackgroundMode())}
                  variant={userState.backgroundMode === BackgroundMode.DAY ? 'contained' : 'outlined'}
                  sx={{ minWidth: '30px', fontSize: '8px' }}
                >
                  {userState.backgroundMode}
                </Button>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography sx={{ fontSize: '12px', minWidth: '80px' }}>Logged In:</Typography>
                <Switch 
                  size="small"
                  checked={userState.loggedIn}
                  onChange={(e) => dispatch(setLoggedIn(e.target.checked))}
                />
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography sx={{ fontSize: '12px', minWidth: '80px' }}>Video:</Typography>
                <Switch 
                  size="small"
                  checked={userState.videoConnected}
                  onChange={(e) => dispatch(setVideoConnected(e.target.checked))}
                />
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography sx={{ fontSize: '12px', minWidth: '80px' }}>Joystick:</Typography>
                <Switch 
                  size="small"
                  checked={userState.showJoystick}
                  onChange={(e) => dispatch(setShowJoystick(e.target.checked))}
                />
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle2">🆔 Session Info</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ fontSize: '12px', fontFamily: 'monospace' }}>
              <Typography>Session ID: {userState.sessionId || 'Not Set'}</Typography>
              <Typography>Players Mapped: {userState.playerNameMap?.size || 0}</Typography>
            </Box>
          </AccordionDetails>
        </Accordion>
      </TabPanel>

      {/* Room State Tab */}
      <TabPanel value={tabValue} index={2}>
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle2">🏠 Connection Status</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography sx={{ fontSize: '12px', minWidth: '80px' }}>Lobby:</Typography>
                <Switch 
                  size="small"
                  checked={roomState.lobbyJoined}
                  onChange={(e) => dispatch(setLobbyJoined(e.target.checked))}
                />
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography sx={{ fontSize: '12px', minWidth: '80px' }}>Room:</Typography>
                <Switch 
                  size="small"
                  checked={roomState.roomJoined}
                  onChange={(e) => dispatch(setRoomJoined(e.target.checked))}
                />
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle2">📋 Room Details</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box>
              {renderEditableField(
                'roomId',
                'Room ID',
                roomState.roomId,
                'text'
              )}
              {renderEditableField(
                'roomName',
                'Room Name',
                roomState.roomName,
                'text'
              )}
              {renderEditableField(
                'roomDescription',
                'Description',
                roomState.roomDescription,
                'text'
              )}
            </Box>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle2">🎯 Available Rooms</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography sx={{ fontSize: '12px', color: 'grey.600' }}>
              Available: {roomState.availableRooms?.length || 0} rooms
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle2">🏢 Meeting Room Management</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box>
              {/* Visual Editing Mode */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 2, 
                mb: 2, 
                p: 1, 
                border: visualEditMode ? '2px solid #ff9800' : '1px solid #ddd', 
                borderRadius: 1,
                backgroundColor: visualEditMode ? '#fff3e0' : 'transparent'
              }}>
                <Typography sx={{ fontSize: '12px', fontWeight: 'bold', flex: 1 }}>
                  🎨 Visual Room Editor
                </Typography>
                <Button
                  size="small"
                  variant={visualEditMode ? 'contained' : 'outlined'}
                  color={visualEditMode ? 'warning' : 'primary'}
                  onClick={toggleVisualEditMode}
                  sx={{ fontSize: '10px', minWidth: '100px' }}
                >
                  {visualEditMode ? '🔧 Exit Edit' : '🎨 Start Edit'}
                </Button>
              </Box>
              
              {visualEditMode && (
                <Box sx={{ 
                  p: 1, 
                  mb: 2, 
                  backgroundColor: '#fff3e0', 
                  borderRadius: 1, 
                  border: '1px solid #ff9800' 
                }}>
                  <Typography sx={{ fontSize: '11px', fontWeight: 'bold', mb: 0.5, color: '#e65100' }}>
                    📝 Visual Edit Mode Active
                  </Typography>
                  <Typography sx={{ fontSize: '10px', color: '#bf360c', mb: 0.5 }}>
                    • Click and drag room areas in the game to move them
                  </Typography>
                  <Typography sx={{ fontSize: '10px', color: '#bf360c', mb: 0.5 }}>
                    • Drag corners/edges to resize room areas
                  </Typography>
                  <Typography sx={{ fontSize: '10px', color: '#bf360c' }}>
                    • Changes are saved automatically
                  </Typography>
                </Box>
              )}

              {/* Network Debug Section */}
              <Box sx={{ mb: 2, p: 1, border: '1px solid #2196f3', borderRadius: 1, backgroundColor: '#e3f2fd' }}>
                <Typography sx={{ fontSize: '11px', fontWeight: 'bold', mb: 1, color: '#1976d2' }}>
                  🔧 Network Debug Tests
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      const network = getNetwork()
                      console.log('🔧 [Debug] Network test result:', {
                        networkExists: !!network,
                        networkType: typeof network,
                        hasDeletMethod: network ? typeof network.deleteMeetingRoom : 'N/A',
                        networkMethods: network ? Object.getOwnPropertyNames(network) : []
                      })
                    }}
                    sx={{ fontSize: '8px' }}
                  >
                    Test Network
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      console.log('🔧 [Debug] Redux state:', {
                        roomsCount: Object.keys(meetingRoomState.meetingRooms).length,
                        areasCount: Object.keys(meetingRoomState.meetingRoomAreas).length,
                        rooms: Object.values(meetingRoomState.meetingRooms).map(r => ({ id: r.id, name: r.name }))
                      })
                    }}
                    sx={{ fontSize: '8px' }}
                  >
                    Test Redux
                  </Button>
                  {Object.keys(meetingRoomState.meetingRooms).length > 1 && (
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      onClick={() => {
                        const testRoom = Object.values(meetingRoomState.meetingRooms).find(r => r.id !== 'default-meeting-room')
                        if (testRoom) {
                          console.log('🔧 [Debug] Testing deletion of room:', testRoom.id)
                          deleteMeetingRoom(testRoom.id)
                        }
                      }}
                      sx={{ fontSize: '8px' }}
                    >
                      Test Delete
                    </Button>
                  )}
                </Box>
              </Box>

              {/* Create New Meeting Room */}
              <Typography sx={{ fontSize: '14px', fontWeight: 'bold', mb: 1 }}>Create New Room</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2, p: 1, border: '1px solid #ddd', borderRadius: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography sx={{ fontSize: '12px', minWidth: '60px' }}>Name:</Typography>
                  <TextField
                    size="small"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    placeholder="Room name"
                    sx={{ fontSize: '10px', flex: 1 }}
                  />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography sx={{ fontSize: '12px', minWidth: '60px' }}>Mode:</Typography>
                  <Select
                    size="small"
                    value={newRoomMode}
                    onChange={(e) => setNewRoomMode(e.target.value as MeetingRoomMode)}
                    sx={{ fontSize: '10px', minWidth: '100px' }}
                    MenuProps={{ sx: { zIndex: 10000 } }}
                  >
                    <MenuItem value="open">Open</MenuItem>
                    <MenuItem value="private">Private</MenuItem>
                    <MenuItem value="secret">Secret</MenuItem>
                  </Select>
                </Box>
                <Grid container spacing={1}>
                  <Grid item xs={3}>
                    <TextField
                      label="X"
                      size="small"
                      type="number"
                      value={newRoomArea.x}
                      onChange={(e) => setNewRoomArea(prev => ({ ...prev, x: Number(e.target.value) }))}
                      sx={{ fontSize: '10px' }}
                    />
                  </Grid>
                  <Grid item xs={3}>
                    <TextField
                      label="Y"
                      size="small"
                      type="number"
                      value={newRoomArea.y}
                      onChange={(e) => setNewRoomArea(prev => ({ ...prev, y: Number(e.target.value) }))}
                      sx={{ fontSize: '10px' }}
                    />
                  </Grid>
                  <Grid item xs={3}>
                    <TextField
                      label="W"
                      size="small"
                      type="number"
                      value={newRoomArea.width}
                      onChange={(e) => setNewRoomArea(prev => ({ ...prev, width: Number(e.target.value) }))}
                      sx={{ fontSize: '10px' }}
                    />
                  </Grid>
                  <Grid item xs={3}>
                    <TextField
                      label="H"
                      size="small"
                      type="number"
                      value={newRoomArea.height}
                      onChange={(e) => setNewRoomArea(prev => ({ ...prev, height: Number(e.target.value) }))}
                      sx={{ fontSize: '10px' }}
                    />
                  </Grid>
                </Grid>
                <Button
                  size="small"
                  variant="contained"
                  onClick={createMeetingRoom}
                  disabled={!newRoomName.trim()}
                  sx={{ fontSize: '10px', mt: 1 }}
                >
                  ➕ Create Room
                </Button>
              </Box>

              {/* Existing Meeting Rooms */}
              <Typography sx={{ fontSize: '14px', fontWeight: 'bold', mb: 1 }}>
                Existing Rooms ({Object.keys(meetingRoomState.meetingRooms).length})
              </Typography>
              {Object.keys(meetingRoomState.meetingRooms).length === 0 ? (
                <Typography sx={{ fontSize: '12px', color: 'grey.600', fontStyle: 'italic' }}>
                  No meeting rooms created yet
                </Typography>
              ) : (
                Object.values(meetingRoomState.meetingRooms).map((room) => {
                  const area = meetingRoomState.meetingRoomAreas[room.id]
                  const isExpanded = expandedRoom === room.id
                  const isEditing = editingRooms[room.id]

                  return (
                    <Accordion key={room.id} expanded={isExpanded} onChange={() => setExpandedRoom(isExpanded ? null : room.id)}>
                      <AccordionSummary sx={{ minHeight: '40px !important' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', pr: 2 }}>
                          <Typography sx={{ fontSize: '12px', fontWeight: 'bold' }}>{room.name}</Typography>
                          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                            <Chip 
                              label={room.mode} 
                              size="small" 
                              sx={{ fontSize: '8px', height: '20px' }}
                              color={room.mode === 'open' ? 'success' : room.mode === 'private' ? 'warning' : 'error'}
                            />
                            <Typography sx={{ fontSize: '10px', color: 'grey.600' }}>
                              {room.participants.length} users
                            </Typography>
                          </Box>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Box>
                          {isEditing ? (
                            /* Editing Mode */
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                              {/* Room Name */}
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography sx={{ fontSize: '10px', minWidth: '60px' }}>Name:</Typography>
                                <TextField
                                  size="small"
                                  value={isEditing.name}
                                  onChange={(e) => updateRoomEdit(room.id, 'name', e.target.value)}
                                  sx={{ fontSize: '10px', flex: 1 }}
                                />
                              </Box>

                              {/* Mode */}
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography sx={{ fontSize: '10px', minWidth: '60px' }}>Mode:</Typography>
                                <Select
                                  size="small"
                                  value={room.mode}
                                  onChange={(e) => updateRoomMode(room.id, e.target.value as MeetingRoomMode)}
                                  sx={{ fontSize: '10px', minWidth: '100px' }}
                                  MenuProps={{ sx: { zIndex: 10000 } }}
                                >
                                  <MenuItem value="open">Open</MenuItem>
                                  <MenuItem value="private">Private</MenuItem>
                                  <MenuItem value="secret">Secret</MenuItem>
                                </Select>
                              </Box>

                              {/* Invited Users */}
                              <Box sx={{ mb: 2 }}>
                                <Typography sx={{ fontSize: '11px', fontWeight: 'bold', mb: 1 }}>
                                  Invited Users ({isEditing.invitedUsers.length})
                                </Typography>
                                
                                {/* Current invited users */}
                                <Box sx={{ mb: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                  {isEditing.invitedUsers.map((userId) => {
                                    const player = onlinePlayers.find(p => p.id === userId)
                                    const displayName = player ? player.name : userId
                                    return (
                                      <Chip
                                        key={userId}
                                        label={displayName}
                                        size="small"
                                        onDelete={() => removeInvitedUser(room.id, userId)}
                                        sx={{ fontSize: '9px', height: '20px' }}
                                      />
                                    )
                                  })}
                                  {isEditing.invitedUsers.length === 0 && (
                                    <Typography sx={{ fontSize: '9px', color: 'grey.500', fontStyle: 'italic' }}>
                                      No users invited
                                    </Typography>
                                  )}
                                </Box>

                                {/* Add new user dropdown */}
                                <Autocomplete
                                  size="small"
                                  options={onlinePlayers.filter(p => !isEditing.invitedUsers.includes(p.id))}
                                  getOptionLabel={(option) => `${option.name} (${option.id})`}
                                  onChange={(event, newValue) => {
                                    if (newValue) {
                                      addInvitedUser(room.id, newValue.id)
                                    }
                                  }}
                                  renderInput={(params) => (
                                    <TextField
                                      {...params}
                                      placeholder="Add user from lobby..."
                                      sx={{ fontSize: '10px' }}
                                    />
                                  )}
                                  value={null}
                                  sx={{ fontSize: '10px' }}
                                />
                                
                                <Typography sx={{ fontSize: '9px', color: 'grey.600', mt: 0.5 }}>
                                  {onlinePlayers.length} users online in lobby
                                  {onlinePlayers.length === 0 && (
                                    <span style={{ color: 'red' }}> (No online players found in playerNameMap)</span>
                                  )}
                                </Typography>
                                
                                {/* Debug info */}
                                <Typography sx={{ fontSize: '8px', color: 'blue', mt: 0.5 }}>
                                  Debug: playerNameMap size: {userState.playerNameMap.size}, 
                                  sessionId: {userState.sessionId || 'null'}
                                </Typography>
                              </Box>

                              {/* Area Settings */}
                              <Typography sx={{ fontSize: '11px', fontWeight: 'bold', mt: 1, mb: 0.5 }}>Area Settings</Typography>
                              <Grid container spacing={1}>
                                <Grid item xs={3}>
                                  <TextField
                                    label="X"
                                    size="small"
                                    type="number"
                                    value={isEditing.area.x}
                                    onChange={(e) => updateRoomAreaEdit(room.id, 'x', Number(e.target.value))}
                                    sx={{ fontSize: '10px' }}
                                  />
                                </Grid>
                                <Grid item xs={3}>
                                  <TextField
                                    label="Y"
                                    size="small"
                                    type="number"
                                    value={isEditing.area.y}
                                    onChange={(e) => updateRoomAreaEdit(room.id, 'y', Number(e.target.value))}
                                    sx={{ fontSize: '10px' }}
                                  />
                                </Grid>
                                <Grid item xs={3}>
                                  <TextField
                                    label="W"
                                    size="small"
                                    type="number"
                                    value={isEditing.area.width}
                                    onChange={(e) => updateRoomAreaEdit(room.id, 'width', Number(e.target.value))}
                                    sx={{ fontSize: '10px' }}
                                  />
                                </Grid>
                                <Grid item xs={3}>
                                  <TextField
                                    label="H"
                                    size="small"
                                    type="number"
                                    value={isEditing.area.height}
                                    onChange={(e) => updateRoomAreaEdit(room.id, 'height', Number(e.target.value))}
                                    sx={{ fontSize: '10px' }}
                                  />
                                </Grid>
                              </Grid>

                              {/* Action Buttons */}
                              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="primary"
                                  onClick={() => saveRoomEdit(room.id)}
                                  sx={{ fontSize: '8px' }}
                                >
                                  ✅ Save
                                </Button>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => cancelRoomEdit(room.id)}
                                  sx={{ fontSize: '8px' }}
                                >
                                  ❌ Cancel
                                </Button>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="error"
                                  onClick={() => deleteMeetingRoom(room.id)}
                                  sx={{ fontSize: '8px', ml: 'auto' }}
                                >
                                  🗑️ Delete
                                </Button>
                              </Box>
                            </Box>
                          ) : (
                            /* View Mode */
                            <Box>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => startRoomEdit(room, area)}
                                  sx={{ fontSize: '8px' }}
                                >
                                  ✏️ Edit
                                </Button>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="error"
                                  onClick={() => deleteMeetingRoom(room.id)}
                                  sx={{ fontSize: '8px' }}
                                >
                                  🗑️ Delete
                                </Button>
                              </Box>
                              
                              <Typography sx={{ fontSize: '10px', color: 'grey.600', mb: 0.5 }}>
                                <strong>ID:</strong> {room.id}
                              </Typography>
                              <Typography sx={{ fontSize: '10px', color: 'grey.600', mb: 0.5 }}>
                                <strong>Host:</strong> {room.hostUserId}
                              </Typography>
                              <Typography sx={{ fontSize: '10px', color: 'grey.600', mb: 0.5 }}>
                                <strong>Participants:</strong> {room.participants.length > 0 ? room.participants.join(', ') : 'None'}
                              </Typography>
                              <Typography sx={{ fontSize: '10px', color: 'grey.600', mb: 0.5 }}>
                                <strong>Invited:</strong> {room.invitedUsers.length > 0 ? 
                                  room.invitedUsers.map((userId: string) => {
                                    const player = onlinePlayers.find(p => p.id === userId)
                                    return player ? player.name : userId
                                  }).join(', ') 
                                  : 'None'}
                              </Typography>
                              {area && (
                                <Typography sx={{ fontSize: '10px', color: 'grey.600' }}>
                                  <strong>Area:</strong> ({area.x}, {area.y}) {area.width}×{area.height}
                                </Typography>
                              )}
                            </Box>
                          )}
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  )
                })
              )}
            </Box>
          </AccordionDetails>
        </Accordion>
      </TabPanel>

      {/* Chat State Tab */}
      <TabPanel value={tabValue} index={3}>
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle2">💬 Chat Settings</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography sx={{ fontSize: '12px', minWidth: '80px' }}>Show Chat:</Typography>
                <Switch 
                  size="small"
                  checked={chatState.showChat}
                  onChange={(e) => dispatch(setShowChat(e.target.checked))}
                />
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography sx={{ fontSize: '12px', minWidth: '80px' }}>Focused:</Typography>
                <Switch 
                  size="small"
                  checked={chatState.focused}
                  onChange={(e) => dispatch(setFocused(e.target.checked))}
                />
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle2">📨 Message Statistics</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ fontSize: '12px', fontFamily: 'monospace' }}>
              <Typography>Chat Messages: {chatState.chatMessages?.length || 0}</Typography>
              <Typography>Meeting Rooms: {Object.keys(chatState.meetingRoomChatMessages || {}).length}</Typography>
              <Typography>Current Room: {chatState.currentMeetingRoomId || 'None'}</Typography>
            </Box>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle2">⚡ Quick Actions</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Button 
              variant="outlined" 
              size="small" 
              onClick={() => dispatch(pushChatMessage({
                author: 'DevMode',
                createdAt: Date.now(),
                content: `Test message from DevMode at ${new Date().toLocaleTimeString()}`
              } as any))}
              fullWidth
              sx={{ mb: 1 }}
            >
              Send Test Message
            </Button>
          </AccordionDetails>
        </Accordion>
      </TabPanel>

      {/* Features Tab */}
      <TabPanel value={tabValue} index={4}>
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle2">💻 Computer/Screen Share</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography sx={{ fontSize: '12px', minWidth: '80px' }}>Dialog Open:</Typography>
                <Switch 
                  size="small"
                  checked={computerState.computerDialogOpen}
                  onChange={(e) => {
                    if (e.target.checked) {
                      dispatch(openComputerDialog({ computerId: 'test-computer', myUserId: 'test-user' }))
                    } else {
                      dispatch(closeComputerDialog())
                    }
                  }}
                />
              </Box>
              <Typography sx={{ fontSize: '10px', color: 'grey.600' }}>
                Connected Computer: {computerState.computerId || 'None'}
              </Typography>
            </Box>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle2">📋 Whiteboard</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography sx={{ fontSize: '12px', minWidth: '80px' }}>Dialog Open:</Typography>
                <Switch 
                  size="small"
                  checked={whiteboardState.whiteboardDialogOpen}
                  onChange={(e) => {
                    if (e.target.checked) {
                      dispatch(openWhiteboardDialog('test-whiteboard'))
                    } else {
                      dispatch(closeWhiteboardDialog())
                    }
                  }}
                />
              </Box>
              <Typography sx={{ fontSize: '10px', color: 'grey.600' }}>
                Current Board: {whiteboardState.whiteboardId || 'None'}
              </Typography>
            </Box>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle2">🏢 Meeting Rooms</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box>
              <Typography sx={{ fontSize: '12px', color: 'grey.600', mb: 1 }}>
                Total Rooms: {meetingRoomState.meetingRooms?.length || 0}
              </Typography>
              <Typography sx={{ fontSize: '12px', color: 'grey.600', mb: 1 }}>
                Current Room: {meetingRoomState.currentMeetingRoomId || 'None'}
              </Typography>
              <Button 
                variant="outlined" 
                size="small" 
                onClick={() => {
                  const testRoom = {
                    id: `test-room-${Date.now()}`,
                    name: `Test Room ${Math.floor(Math.random() * 100)}`,
                    mode: 'open' as const,
                    hostUserId: userState.sessionId || 'test-user',
                    invitedUsers: [],
                    participants: []
                  }
                  const testArea = {
                    meetingRoomId: testRoom.id,
                    x: Math.floor(Math.random() * 500),
                    y: Math.floor(Math.random() * 500),
                    width: 100,
                    height: 100
                  }
                  dispatch(addMeetingRoom(testRoom))
                  dispatch(addMeetingRoomArea(testArea))
                }}
                fullWidth
              >
                Create Test Meeting Room
              </Button>
            </Box>
          </AccordionDetails>
        </Accordion>
      </TabPanel>

      {/* Mock Data Tab */}
      <TabPanel value={tabValue} index={5}>
        <Typography variant="subtitle2" sx={{ mb: 2 }}>🎭 Mock Operations</Typography>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" display="block">Work Time Setting</Typography>
          <TextField
            size="small"
            type="datetime-local"
            value={mockWorkTime}
            onChange={(e) => setMockWorkTime(e.target.value)}
            fullWidth
            sx={{ mb: 1 }}
          />
          <Button variant="outlined" size="small" onClick={handleMockWorkStart} fullWidth>
            Start Work (Specified Time)
          </Button>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" display="block">Fatigue Level Setting: {mockFatigue}%</Typography>
          <TextField
            size="small"
            type="number"
            value={mockFatigue}
            onChange={(e) => setMockFatigue(Number(e.target.value))}
            inputProps={{ min: 0, max: 100 }}
            fullWidth
            sx={{ mb: 1 }}
          />
          <Button variant="outlined" size="small" onClick={handleSetFatigue} fullWidth>
            Set Fatigue Level
          </Button>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box>
          <Typography variant="caption" display="block" sx={{ mb: 1 }}>Quick Actions</Typography>
          <Grid container spacing={1}>
            <Grid item xs={6}>
              <Button 
                variant="contained" 
                size="small" 
                onClick={() => dispatch(startWork())}
                fullWidth
              >
                Start Work
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button 
                variant="outlined" 
                size="small" 
                onClick={() => dispatch(endWork())}
                fullWidth
              >
                End Work
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button 
                variant="contained" 
                color="warning"
                size="small" 
                onClick={() => dispatch(startBreak())}
                fullWidth
              >
                Start Break
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button 
                variant="outlined" 
                color="warning"
                size="small" 
                onClick={() => dispatch(endBreak())}
                fullWidth
              >
                End Break
              </Button>
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box>
          <Typography variant="caption" display="block" sx={{ mb: 1 }}>Other Player Testing</Typography>
          <Button 
            variant="outlined" 
            size="small" 
            onClick={addMockPlayer}
            fullWidth
            sx={{ mb: 1 }}
          >
            Add Random Player
          </Button>
          <Button 
            variant="contained" 
            size="small" 
            onClick={() => {
              for (let i = 0; i < 5; i++) {
                setTimeout(() => addMockPlayer(), i * 100)
              }
            }}
            fullWidth
            sx={{ mb: 1, backgroundColor: '#2196f3' }}
          >
            Add 5 Test Players
          </Button>
          <Button 
            variant="outlined" 
            size="small" 
            onClick={testNetworkSync}
            fullWidth
            sx={{ mb: 1 }}
          >
            Network Sync Test
          </Button>
          <Button 
            variant="contained" 
            size="small" 
            onClick={simulateOtherPlayerStatusChange}
            fullWidth
            sx={{ mb: 1, backgroundColor: '#ff9800' }}
          >
            Test Other Player Status Change
          </Button>
          <Button 
            variant="outlined" 
            size="small" 
            onClick={testSendWorkStatus}
            fullWidth
            sx={{ mb: 1, borderColor: '#4caf50', color: '#4caf50' }}
          >
            Test Own Status Send
          </Button>
          <Typography variant="caption" sx={{ color: 'grey.600', fontSize: '9px' }}>
            After adding, click "Detailed Status" in WorkStatusPanel to check player list
          </Typography>
          
          <Divider sx={{ my: 2 }} />

          <Box>
            <Typography variant="caption" display="block" sx={{ mb: 1 }}>Scenario Testing</Typography>
            
            <Button 
              variant="contained" 
              size="small" 
              onClick={() => {
                // Simulate a full work day
                dispatch(setWorkStartTime(Date.now() - 8 * 60 * 60 * 1000)) // 8 hours ago
                dispatch(startWork())
                dispatch(setFatigueLevel(75))
                dispatch(updateWorkStatus({ 
                  workStatus: 'working', 
                  clothing: 'tired', 
                  accessory: 'coffee' 
                }))
              }}
              fullWidth
              sx={{ mb: 1, backgroundColor: '#9c27b0' }}
            >
              Simulate Full Work Day
            </Button>

            <Button 
              variant="contained" 
              size="small" 
              onClick={() => {
                // Simulate fresh start
                dispatch(endWork())
                dispatch(setFatigueLevel(0))
                dispatch(updateWorkStatus({ 
                  workStatus: 'off-duty', 
                  clothing: 'business', 
                  accessory: 'none' 
                }))
                dispatch(setWorkStartTime(0))
              }}
              fullWidth
              sx={{ mb: 1, backgroundColor: '#4caf50' }}
            >
              Reset to Fresh State
            </Button>

            <Button 
              variant="contained" 
              size="small" 
              onClick={() => {
                // Add multiple test players
                for (let i = 1; i <= 5; i++) {
                  const statuses = ['working', 'break', 'meeting', 'off-duty'] as const
                  const randomStatus = statuses[Math.floor(Math.random() * statuses.length)]
                  dispatch(updateOtherPlayerWorkStatus({
                    playerId: `test-player-${i}`,
                    playerName: `Test User ${i}`,
                    workStatus: randomStatus
                  }))
                }
              }}
              fullWidth
              sx={{ mb: 1, backgroundColor: '#ff9800' }}
            >
              Add 5 Test Players
            </Button>

            <Button 
              variant="outlined" 
              size="small" 
              onClick={() => {
                // Clear all test data
                Object.keys(workState.otherPlayersWorkStatus).forEach(playerId => {
                  if (playerId.startsWith('test-player-') || playerId.startsWith('mock_player_')) {
                    // Note: We would need a removePlayerWorkStatus action for this
                    console.log(`Would remove ${playerId}`)
                  }
                })
              }}
              fullWidth
              sx={{ mb: 1 }}
            >
              Clear Test Data
            </Button>
          </Box>

          <Box sx={{ mt: 2, p: 1, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 1 }}>
              Network Sync Status
            </Typography>
            <Typography variant="caption" sx={{ fontSize: '9px', fontFamily: 'monospace', display: 'block' }}>
              Other Players: {Object.keys(workState.otherPlayersWorkStatus).length}
            </Typography>
            {Object.entries(workState.otherPlayersWorkStatus).map(([playerId, player]) => (
              <Typography 
                key={playerId} 
                variant="caption" 
                sx={{ fontSize: '8px', fontFamily: 'monospace', display: 'block', color: 'grey.700' }}
              >
                {player.playerName}: {player.workStatus} ({new Date(player.lastUpdated).toLocaleTimeString()})
              </Typography>
            ))}
          </Box>
        </Box>
      </TabPanel>

      {/* Log Display Tab */}
      <TabPanel value={tabValue} index={6}>
        <Box sx={{ mb: 2 }}>
          <Grid container spacing={1} alignItems="center">
            <Grid item xs={6}>
              <FormControl size="small" fullWidth>
                <InputLabel>Level</InputLabel>
                <Select
                  value={logFilter}
                  onChange={(e) => setLogFilter(e.target.value as LogLevel | 'all')}
                  MenuProps={{ sx: { zIndex: 10000 } }}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value={LogLevel.DEBUG}>DEBUG</MenuItem>
                  <MenuItem value={LogLevel.INFO}>INFO</MenuItem>
                  <MenuItem value={LogLevel.WARN}>WARN</MenuItem>
                  <MenuItem value={LogLevel.ERROR}>ERROR</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl size="small" fullWidth>
                <InputLabel>Component</InputLabel>
                <Select
                  value={componentFilter}
                  onChange={(e) => setComponentFilter(e.target.value)}
                  MenuProps={{ sx: { zIndex: 10000 } }}
                >
                  {components.map(component => (
                    <MenuItem key={component} value={component}>
                      {component}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          <Button 
            variant="outlined" 
            size="small" 
            onClick={logManager.clearLogs}
            sx={{ mt: 1 }}
          >
            Clear Logs
          </Button>
        </Box>

        <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
          {filteredLogs.slice(-50).reverse().map((log, index) => (
            <Paper 
              key={index} 
              variant="outlined" 
              sx={{ 
                p: 1, 
                mb: 1, 
                fontSize: '10px',
                backgroundColor: log.level === LogLevel.ERROR ? '#ffebee' : 
                                 log.level === LogLevel.WARN ? '#fff3e0' : 'inherit'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Chip 
                  label={LogLevel[log.level]} 
                  size="small" 
                  color={log.level === LogLevel.ERROR ? 'error' : 
                         log.level === LogLevel.WARN ? 'warning' : 'default'}
                />
                <Typography variant="caption">{log.component}</Typography>
                <Typography variant="caption" sx={{ ml: 'auto' }}>
                  {new Date(log.timestamp).toLocaleTimeString()}
                </Typography>
              </Box>
              <Typography variant="caption" display="block">
                {log.message}
              </Typography>
              {log.data && (
                <Typography 
                  variant="caption" 
                  display="block" 
                  sx={{ fontFamily: 'monospace', color: 'grey.600' }}
                >
                  {JSON.stringify(log.data, null, 2)}
                </Typography>
              )}
            </Paper>
          ))}
        </Box>
      </TabPanel>
    </Paper>
  )
}

export default DevModePanel