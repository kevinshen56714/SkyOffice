import React, { useState, useEffect } from 'react'
import { Box, Typography, Paper } from '@mui/material'
import { useSelector } from 'react-redux'
import { RootState } from '../stores'
import { useDevLogger } from '../hooks/useDevMode'

interface WorkTimeCounterProps {
    compact?: boolean
}

const WorkTimeCounter: React.FC<WorkTimeCounterProps> = ({ compact = false }) => {
    const { currentWorkStatus, workStartTime, fatigueLevel } = useSelector((state: RootState) => state.work)
    const [currentTime, setCurrentTime] = useState(Date.now())
    const logger = useDevLogger('WorkTimeCounter')
    
    // DevMode時のみデバッグログ
    logger.debug('Current state:', {
        currentWorkStatus,
        workStartTime,
        fatigueLevel,
        currentTime,
        isWorking: currentWorkStatus !== 'off-duty' && workStartTime > 0
    })

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(Date.now())
        }, 1000) // 1秒ごとに更新

        return () => clearInterval(interval)
    }, [])

    const formatDuration = (milliseconds: number): string => {
        const totalSeconds = Math.floor(milliseconds / 1000)
        const hours = Math.floor(totalSeconds / 3600)
        const minutes = Math.floor((totalSeconds % 3600) / 60)
        const seconds = totalSeconds % 60

        if (compact) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        }
        return `${hours}時間${minutes}分${seconds}秒`
    }

    const getWorkDuration = (): number => {
        if (currentWorkStatus === 'off-duty' || workStartTime === 0) {
            return 0
        }
        return currentTime - workStartTime
    }

    const getFatigueColor = (level: number): string => {
        if (level < 30) return '#4caf50' // Green
        if (level < 60) return '#ff9800' // Orange
        return '#f44336' // Red
    }

    const workDuration = getWorkDuration()
    const isWorking = currentWorkStatus !== 'off-duty' && workStartTime > 0

    // compact表示でも常に何かしらの情報を表示する
    if (compact && !isWorking) {
        return (
            <Typography 
                variant="body1" 
                sx={{ 
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: '#666',
                    fontFamily: 'monospace'
                }}
            >
                未勤務
            </Typography>
        )
    }

    return (
        <Paper
            elevation={2}
            sx={{
                padding: compact ? 1 : 2,
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(0, 0, 0, 0.1)',
                minWidth: compact ? '120px' : '200px'
            }}
        >
            {!compact && (
                <Typography variant="h6" sx={{ fontSize: '14px', fontWeight: 'bold', mb: 1 }}>
                    ⏰ 勤務時間
                </Typography>
            )}
            
            <Box sx={{ display: 'flex', flexDirection: compact ? 'row' : 'column', alignItems: compact ? 'center' : 'flex-start', gap: compact ? 1 : 0.5 }}>
                <Typography 
                    variant="body1" 
                    sx={{ 
                        fontSize: compact ? '12px' : '16px',
                        fontWeight: 'bold',
                        color: isWorking ? '#1976d2' : '#666',
                        fontFamily: 'monospace'
                    }}
                >
                    {isWorking ? formatDuration(workDuration) : '未勤務'}
                </Typography>

                {!compact && fatigueLevel > 0 && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        <Typography variant="caption" sx={{ fontSize: '10px' }}>
                            疲労度:
                        </Typography>
                        <Box
                            sx={{
                                width: '60px',
                                height: '6px',
                                backgroundColor: '#e0e0e0',
                                borderRadius: '3px',
                                overflow: 'hidden'
                            }}
                        >
                            <Box
                                sx={{
                                    width: `${fatigueLevel}%`,
                                    height: '100%',
                                    backgroundColor: getFatigueColor(fatigueLevel),
                                    transition: 'all 0.3s ease'
                                }}
                            />
                        </Box>
                        <Typography 
                            variant="caption" 
                            sx={{ 
                                fontSize: '10px',
                                color: getFatigueColor(fatigueLevel),
                                fontWeight: 'bold'
                            }}
                        >
                            {fatigueLevel}%
                        </Typography>
                    </Box>
                )}
            </Box>

            {!compact && workDuration > 8 * 60 * 60 * 1000 && ( // 8時間超過
                <Typography 
                    variant="caption" 
                    sx={{ 
                        fontSize: '10px',
                        color: '#f44336',
                        fontWeight: 'bold',
                        mt: 0.5,
                        display: 'block'
                    }}
                >
                    ⚠️ 労働基準法の上限を超えています
                </Typography>
            )}
        </Paper>
    )
}

export default WorkTimeCounter