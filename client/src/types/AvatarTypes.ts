/**
 * Avatar Group System Types
 * Defines avatar variations based on work status and fatigue levels
 */

export type BaseAvatarType = 'adam' | 'ash' | 'lucy' | 'nancy'

export type WorkStatusAvatarType = 
  | 'business'    // Formal business attire
  | 'casual'      // Casual/relaxed clothing
  | 'tired'       // Tired/exhausted appearance
  | 'meeting'     // Meeting/presentation ready
  | 'overtime'    // Late night/overtime appearance
  | 'off-duty'    // Off work/going home appearance

export type FatigueLevel = 'fresh' | 'normal' | 'tired' | 'exhausted'

export interface AvatarGroup {
  baseCharacter: BaseAvatarType
  workStatus: WorkStatusAvatarType
  fatigueLevel: FatigueLevel
  spriteName: string  // Current: use existing sprites, Future: specific sprite files
}

export interface AvatarMapping {
  [key: string]: {
    [status in WorkStatusAvatarType]: {
      [fatigue in FatigueLevel]: string
    }
  }
}

// Default avatar mapping using existing assets
export const AVATAR_MAPPING: AvatarMapping = {
  adam: {
    business: {
      fresh: 'adam',
      normal: 'adam', 
      tired: 'ash',      // Temporary: use ash for tired business
      exhausted: 'ash'
    },
    casual: {
      fresh: 'adam',
      normal: 'adam',
      tired: 'ash',
      exhausted: 'ash'
    },
    tired: {
      fresh: 'ash',      // Use ash as tired version
      normal: 'ash',
      tired: 'ash',
      exhausted: 'ash'
    },
    meeting: {
      fresh: 'adam',     // Use base for meeting
      normal: 'adam',
      tired: 'ash',
      exhausted: 'ash'
    },
    overtime: {
      fresh: 'ash',      // Use ash for overtime
      normal: 'ash',
      tired: 'ash',
      exhausted: 'ash'
    },
    'off-duty': {
      fresh: 'lucy',     // Use lucy for adam off-duty
      normal: 'lucy',
      tired: 'lucy',
      exhausted: 'lucy'
    }
  },
  ash: {
    business: {
      fresh: 'ash',
      normal: 'ash',
      tired: 'adam',     // Swap for variation
      exhausted: 'adam'
    },
    casual: {
      fresh: 'ash',
      normal: 'ash', 
      tired: 'adam',
      exhausted: 'adam'
    },
    tired: {
      fresh: 'adam',
      normal: 'adam',
      tired: 'adam',
      exhausted: 'adam'
    },
    meeting: {
      fresh: 'ash',
      normal: 'ash',
      tired: 'adam',
      exhausted: 'adam'
    },
    overtime: {
      fresh: 'adam',
      normal: 'adam',
      tired: 'adam',
      exhausted: 'adam'
    },
    'off-duty': {
      fresh: 'nancy',    // Use nancy for ash off-duty
      normal: 'nancy',
      tired: 'nancy',
      exhausted: 'nancy'
    }
  },
  lucy: {
    business: {
      fresh: 'lucy',
      normal: 'lucy',
      tired: 'nancy',
      exhausted: 'nancy'
    },
    casual: {
      fresh: 'lucy',
      normal: 'lucy',
      tired: 'nancy',
      exhausted: 'nancy'
    },
    tired: {
      fresh: 'nancy',
      normal: 'nancy',
      tired: 'nancy',
      exhausted: 'nancy'
    },
    meeting: {
      fresh: 'lucy',
      normal: 'lucy',
      tired: 'nancy',
      exhausted: 'nancy'
    },
    overtime: {
      fresh: 'nancy',
      normal: 'nancy',
      tired: 'nancy',
      exhausted: 'nancy'
    },
    'off-duty': {
      fresh: 'adam',     // Use adam for lucy off-duty
      normal: 'adam',
      tired: 'adam',
      exhausted: 'adam'
    }
  },
  nancy: {
    business: {
      fresh: 'nancy',
      normal: 'nancy',
      tired: 'lucy',
      exhausted: 'lucy'
    },
    casual: {
      fresh: 'nancy',
      normal: 'nancy',
      tired: 'lucy',
      exhausted: 'lucy'
    },
    tired: {
      fresh: 'lucy',
      normal: 'lucy',
      tired: 'lucy',
      exhausted: 'lucy'
    },
    meeting: {
      fresh: 'nancy',
      normal: 'nancy',
      tired: 'lucy',
      exhausted: 'lucy'
    },
    overtime: {
      fresh: 'lucy',
      normal: 'lucy',
      tired: 'lucy',
      exhausted: 'lucy'
    },
    'off-duty': {
      fresh: 'ash',      // Use ash for nancy off-duty
      normal: 'ash',
      tired: 'ash',
      exhausted: 'ash'
    }
  }
}

/**
 * Get fatigue level based on fatigue percentage
 */
export function getFatigueLevelFromPercentage(fatiguePercentage: number): FatigueLevel {
  if (fatiguePercentage <= 20) return 'fresh'
  if (fatiguePercentage <= 50) return 'normal'
  if (fatiguePercentage <= 80) return 'tired'
  return 'exhausted'
}

/**
 * Convert work status to avatar work status
 */
export function getAvatarWorkStatus(workStatus: string): WorkStatusAvatarType {
  switch (workStatus) {
    case 'working': return 'business'
    case 'break': return 'casual'
    case 'meeting': return 'meeting'
    case 'overtime': return 'overtime'
    case 'off-duty': return 'off-duty'
    default: return 'casual'
  }
}

/**
 * Get appropriate sprite name based on base character, work status, and fatigue
 */
export function getAvatarSprite(
  baseCharacter: BaseAvatarType, 
  workStatus: string, 
  fatiguePercentage: number
): string {
  const avatarWorkStatus = getAvatarWorkStatus(workStatus)
  const fatigueLevel = getFatigueLevelFromPercentage(fatiguePercentage)
  
  return AVATAR_MAPPING[baseCharacter][avatarWorkStatus][fatigueLevel]
}