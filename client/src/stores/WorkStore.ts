import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { WorkStatus, ClothingType, AccessoryType } from '../../../types/IOfficeState'
import { BaseAvatarType, getAvatarSprite } from '../types/AvatarTypes'

interface WorkState {
    currentWorkStatus: WorkStatus
    workStartTime: number
    lastBreakTime: number
    fatigueLevel: number
    currentClothing: ClothingType
    currentAccessory: AccessoryType
    // Avatar group system
    baseAvatar: BaseAvatarType
    currentAvatarSprite: string
    // 他のプレイヤーの勤務状況も管理
    otherPlayersWorkStatus: Record<string, {
        playerId: string
        playerName: string
        workStatus: WorkStatus
        lastUpdated: number
    }>
}

const initialState: WorkState = {
    currentWorkStatus: 'off-duty',
    workStartTime: 0,
    lastBreakTime: 0,
    fatigueLevel: 0,
    currentClothing: 'casual',
    currentAccessory: 'none',
    baseAvatar: 'adam',
    currentAvatarSprite: getAvatarSprite('adam', 'off-duty', 0),  // Calculate correct initial sprite
    otherPlayersWorkStatus: {}
}

console.log('🔧 [WorkStore] Initial state created:', initialState)

export const workSlice = createSlice({
    name: 'work',
    initialState,
    reducers: {
        startWork: (state) => {
            const currentTime = Date.now()
            state.currentWorkStatus = 'working'
            state.workStartTime = currentTime
            state.lastBreakTime = currentTime
            state.fatigueLevel = 0
            state.currentClothing = 'business'
            state.currentAccessory = 'none'
            
            // Update avatar sprite for work status
            state.currentAvatarSprite = getAvatarSprite(
                state.baseAvatar, 
                state.currentWorkStatus, 
                state.fatigueLevel
            )
            console.log(`🏢 [WorkStore] Started work, avatar: ${state.currentAvatarSprite}`)
        },
        endWork: (state) => {
            state.currentWorkStatus = 'off-duty'
            state.workStartTime = 0
            state.fatigueLevel = 0
            state.currentClothing = 'casual'
            state.currentAccessory = 'none'
            
            // Update avatar sprite for off-duty status
            state.currentAvatarSprite = getAvatarSprite(
                state.baseAvatar, 
                state.currentWorkStatus, 
                state.fatigueLevel
            )
            console.log(`🏠 [WorkStore] Ended work, avatar: ${state.currentAvatarSprite}`)
        },
        startBreak: (state) => {
            state.currentWorkStatus = 'break'
            state.lastBreakTime = Date.now()
            state.currentClothing = 'casual'
            state.currentAccessory = 'coffee'
            
            // Update avatar sprite for break status
            state.currentAvatarSprite = getAvatarSprite(
                state.baseAvatar, 
                state.currentWorkStatus, 
                state.fatigueLevel
            )
            console.log(`☕ [WorkStore] Started break, avatar: ${state.currentAvatarSprite}`)
        },
        endBreak: (state) => {
            state.currentWorkStatus = 'working'
            state.currentClothing = 'business'
            state.currentAccessory = 'documents'
            
            // Update avatar sprite back to working status
            state.currentAvatarSprite = getAvatarSprite(
                state.baseAvatar, 
                state.currentWorkStatus, 
                state.fatigueLevel
            )
            console.log(`💼 [WorkStore] Ended break, avatar: ${state.currentAvatarSprite}`)
        },
        updateWorkStatus: (state, action: PayloadAction<{
            workStatus: WorkStatus,
            clothing?: ClothingType,
            accessory?: AccessoryType
        }>) => {
            state.currentWorkStatus = action.payload.workStatus
            if (action.payload.clothing) {
                state.currentClothing = action.payload.clothing
            }
            if (action.payload.accessory) {
                state.currentAccessory = action.payload.accessory
            }
            
            // Update avatar sprite based on new work status
            state.currentAvatarSprite = getAvatarSprite(
                state.baseAvatar, 
                state.currentWorkStatus, 
                state.fatigueLevel
            )
            console.log(`🔄 [WorkStore] Updated work status to ${action.payload.workStatus}, avatar: ${state.currentAvatarSprite}`)
        },
        updateFatigueLevel: (state, action: PayloadAction<number>) => {
            state.fatigueLevel = Math.max(0, Math.min(100, action.payload))
            // Update clothing based on fatigue level
            if (state.fatigueLevel > 70) {
                state.currentClothing = 'tired'
            } else if (state.currentWorkStatus === 'working') {
                state.currentClothing = 'business'
            }
            
            // Update avatar sprite based on new fatigue level
            state.currentAvatarSprite = getAvatarSprite(
                state.baseAvatar, 
                state.currentWorkStatus, 
                state.fatigueLevel
            )
            console.log(`💪 [WorkStore] Fatigue level updated to ${state.fatigueLevel}%, avatar: ${state.currentAvatarSprite}`)
        },
        updateOtherPlayerWorkStatus: (state, action: PayloadAction<{
            playerId: string,
            playerName: string,
            workStatus: WorkStatus
        }>) => {
            const { playerId, playerName, workStatus } = action.payload
            state.otherPlayersWorkStatus[playerId] = {
                playerId,
                playerName,
                workStatus,
                lastUpdated: Date.now()
            }
            console.log(`👥 [WorkStore] Updated ${playerName}'s work status to ${workStatus}`)
        },
        removePlayerWorkStatus: (state, action: PayloadAction<string>) => {
            delete state.otherPlayersWorkStatus[action.payload]
        },
        // Avatar group system actions
        setBaseAvatar: (state, action: PayloadAction<BaseAvatarType>) => {
            state.baseAvatar = action.payload
            // Update current avatar sprite based on new base avatar
            state.currentAvatarSprite = getAvatarSprite(
                state.baseAvatar, 
                state.currentWorkStatus, 
                state.fatigueLevel
            )
            console.log(`🎭 [WorkStore] Base avatar changed to ${state.baseAvatar}, sprite: ${state.currentAvatarSprite}`)
        },
        updateAvatarSprite: (state) => {
            // Force update avatar sprite based on current state
            state.currentAvatarSprite = getAvatarSprite(
                state.baseAvatar, 
                state.currentWorkStatus, 
                state.fatigueLevel
            )
            console.log(`🔄 [WorkStore] Avatar sprite updated to ${state.currentAvatarSprite}`)
        },
        // DevMode exclusive actions
        setWorkStartTime: (state, action: PayloadAction<number>) => {
            state.workStartTime = action.payload
        },
        setFatigueLevel: (state, action: PayloadAction<number>) => {
            state.fatigueLevel = Math.max(0, Math.min(100, action.payload))
            // Update avatar when fatigue is set via DevMode
            state.currentAvatarSprite = getAvatarSprite(
                state.baseAvatar, 
                state.currentWorkStatus, 
                state.fatigueLevel
            )
            console.log(`🐛 [WorkStore DevMode] Fatigue set to ${state.fatigueLevel}%, avatar: ${state.currentAvatarSprite}`)
        }
    }
})

export const {
    startWork,
    endWork,
    startBreak,
    endBreak,
    updateWorkStatus,
    updateFatigueLevel,
    updateOtherPlayerWorkStatus,
    removePlayerWorkStatus,
    setBaseAvatar,
    updateAvatarSprite,
    setWorkStartTime,
    setFatigueLevel
} = workSlice.actions

export default workSlice.reducer