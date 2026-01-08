import React from 'react'
import { Chip, Tooltip } from '@mui/material'
import { WorkStatus } from '../../../types/IOfficeState'
import { useDevLogger } from '../hooks/useDevMode'

interface WorkStatusBadgeProps {
    workStatus: WorkStatus
    playerName?: string
    size?: 'small' | 'medium'
    showLabel?: boolean
}

const getStatusConfig = (status: WorkStatus) => {
    switch (status) {
        case 'working':
            return {
                icon: '🟢',
                label: '勤務中',
                color: '#2e7d32' as const,
                bgcolor: '#e8f5e8'
            }
        case 'break':
            return {
                icon: '🟡',
                label: '休憩中',
                color: '#f57c00' as const,
                bgcolor: '#fff3e0'
            }
        case 'meeting':
            return {
                icon: '🔴',
                label: '会議中',
                color: '#d32f2f' as const,
                bgcolor: '#ffebee'
            }
        case 'overtime':
            return {
                icon: '🟠',
                label: '残業中',
                color: '#f57c00' as const,
                bgcolor: '#fff3e0'
            }
        case 'off-duty':
        default:
            return {
                icon: '⚫',
                label: '退勤済み',
                color: '#616161' as const,
                bgcolor: '#f5f5f5'
            }
    }
}

const WorkStatusBadge: React.FC<WorkStatusBadgeProps> = ({ 
    workStatus, 
    playerName,
    size = 'small',
    showLabel = true 
}) => {
    const logger = useDevLogger('WorkStatusBadge')
    
    // DevMode時のみデバッグログ
    logger.debug('Props:', {
        workStatus,
        playerName,
        size,
        showLabel
    })
    
    const config = getStatusConfig(workStatus)
    
    const chipContent = showLabel 
        ? `${config.icon} ${config.label}`
        : config.icon

    const tooltipTitle = playerName 
        ? `${playerName}: ${config.label}`
        : config.label

    return (
        <Tooltip title={tooltipTitle} arrow>
            <Chip
                label={chipContent}
                size={size}
                sx={{
                    color: config.color,
                    backgroundColor: config.bgcolor,
                    border: `1px solid ${config.color}40`,
                    fontSize: size === 'small' ? '10px' : '12px',
                    height: size === 'small' ? '20px' : '24px',
                    '& .MuiChip-label': {
                        paddingX: size === 'small' ? 0.5 : 1,
                        fontWeight: 500
                    }
                }}
            />
        </Tooltip>
    )
}

export default WorkStatusBadge