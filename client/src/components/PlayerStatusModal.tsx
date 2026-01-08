import React, { useState, useEffect } from 'react'
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    Grid,
    Divider,
    Avatar,
    Chip,
    LinearProgress,
    Paper
} from '@mui/material'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../stores'
import { startWork, endWork, startBreak, endBreak, updateWorkStatus } from '../stores/WorkStore'
import WorkStatusBadge from './WorkStatusBadge'
import phaserGame from '../PhaserGame'
import Game from '../scenes/Game'

interface PlayerStatusModalProps {
    open: boolean
    onClose: () => void
    playerId?: string // Own player ID or other player ID
}

const PlayerStatusModal: React.FC<PlayerStatusModalProps> = ({ open, onClose, playerId }) => {
    const dispatch = useDispatch()
    const [currentTime, setCurrentTime] = useState(Date.now())
    
    const { 
        currentWorkStatus, 
        workStartTime, 
        lastBreakTime, 
        fatigueLevel,
        currentClothing,
        currentAccessory,
        otherPlayersWorkStatus 
    } = useSelector((state: RootState) => state.work)
    
    const { sessionId, playerNameMap } = useSelector((state: RootState) => state.user)
    const isOwnPlayer = !playerId || playerId === sessionId
    const targetPlayer = isOwnPlayer ? null : otherPlayersWorkStatus[playerId || '']
    const playerName = isOwnPlayer ? playerNameMap[sessionId || ''] || 'You' : targetPlayer?.playerName || 'Unknown'

    // Debug: Log when other player data is not found
    useEffect(() => {
        if (!isOwnPlayer && playerId && !targetPlayer) {
            console.warn(`⚠️ [PlayerStatusModal] Player data not found for ID: ${playerId}`)
            console.log('Available other players:', Object.keys(otherPlayersWorkStatus))
            console.log('Full other players data:', otherPlayersWorkStatus)
        }
    }, [isOwnPlayer, playerId, targetPlayer, otherPlayersWorkStatus])

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(Date.now())
        }, 1000)
        return () => clearInterval(interval)
    }, [])

    const formatDuration = (milliseconds: number): string => {
        const totalSeconds = Math.floor(milliseconds / 1000)
        const hours = Math.floor(totalSeconds / 3600)
        const minutes = Math.floor((totalSeconds % 3600) / 60)
        const seconds = totalSeconds % 60
        return `${hours}h ${minutes}m ${seconds}s`
    }

    const getWorkDuration = (): number => {
        if (currentWorkStatus === 'off-duty' || workStartTime === 0) {
            return 0
        }
        return currentTime - workStartTime
    }

    const getBreakDuration = (): number => {
        if (currentWorkStatus !== 'break' || lastBreakTime === 0) {
            return 0
        }
        return currentTime - lastBreakTime
    }

    const getFatigueColor = (level: number): string => {
        if (level < 30) return '#4caf50' // Green
        if (level < 60) return '#ff9800' // Orange
        return '#f44336' // Red
    }

    const getClothingDisplay = (clothing: string): string => {
        switch (clothing) {
            case 'business': return '🤵 Business Suit'
            case 'casual': return '👕 Casual'
            case 'tired': return '😴 Tired'
            default: return '👔 Uniform'
        }
    }

    const getAccessoryDisplay = (accessory: string): string => {
        switch (accessory) {
            case 'coffee': return '☕ Coffee'
            case 'documents': return '📄 Documents'
            case 'none': return 'None'
            default: return 'None'
        }
    }

    const handleStatusChange = (newStatus: string) => {
        const game = phaserGame.scene.keys.game as Game
        switch (newStatus) {
            case 'working':
                if (currentWorkStatus === 'off-duty') {
                    dispatch(startWork())
                    game?.network?.startWork()
                } else if (currentWorkStatus === 'break') {
                    dispatch(endBreak())
                    game?.network?.endBreak()
                }
                break
            case 'break':
                dispatch(startBreak())
                game?.network?.startBreak()
                break
            case 'off-duty':
                dispatch(endWork())
                game?.network?.endWork()
                break
        }
    }

    const workDuration = getWorkDuration()
    const breakDuration = getBreakDuration()
    const displayStatus = isOwnPlayer ? currentWorkStatus : targetPlayer?.workStatus || 'off-duty'

    return (
        <Dialog 
            open={open} 
            onClose={onClose} 
            maxWidth="sm" 
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 2,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
                }
            }}
        >
            <DialogTitle sx={{ pb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: '#1976d2', width: 40, height: 40 }}>
                        👤
                    </Avatar>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            {playerName}'s Status
                        </Typography>
                        <WorkStatusBadge workStatus={displayStatus} />
                    </Box>
                </Box>
            </DialogTitle>

            <Divider />

            <DialogContent sx={{ pt: 2 }}>
                <Grid container spacing={3}>
                    {/* Work Information */}
                    <Grid item xs={12}>
                        <Paper elevation={1} sx={{ p: 2, backgroundColor: '#f8f9fa' }}>
                            <Typography variant="h6" sx={{ fontSize: '16px', fontWeight: 'bold', mb: 2 }}>
                                📊 Work Information
                            </Typography>
                            {isOwnPlayer ? (
                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <Typography variant="body2" color="text.secondary">
                                            Today's Work Time
                                        </Typography>
                                        <Typography variant="h6" sx={{ fontFamily: 'monospace', color: '#1976d2' }}>
                                            {workDuration > 0 ? formatDuration(workDuration) : 'Not Working'}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="body2" color="text.secondary">
                                            Current Break Time
                                        </Typography>
                                        <Typography variant="h6" sx={{ fontFamily: 'monospace', color: '#f57c00' }}>
                                            {breakDuration > 0 ? formatDuration(breakDuration) : '-'}
                                        </Typography>
                                    </Grid>
                                </Grid>
                            ) : (
                                <Box>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                        Current Status
                                    </Typography>
                                    <WorkStatusBadge 
                                        workStatus={displayStatus} 
                                        playerName={playerName}
                                        size="medium"
                                        showLabel={true}
                                    />
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2, fontStyle: 'italic' }}>
                                        💡 Other players' detailed work information is private
                                    </Typography>
                                    {targetPlayer && (
                                        <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'grey.600' }}>
                                            Last Updated: {new Date(targetPlayer.lastUpdated).toLocaleString()}
                                        </Typography>
                                    )}
                                </Box>
                            )}
                        </Paper>
                    </Grid>

                    {/* Fatigue Level (own player only) */}
                    {isOwnPlayer && (
                        <Grid item xs={12}>
                            <Paper elevation={1} sx={{ p: 2, backgroundColor: '#f8f9fa' }}>
                                <Typography variant="h6" sx={{ fontSize: '16px', fontWeight: 'bold', mb: 2 }}>
                                    😴 Fatigue Level
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <LinearProgress
                                        variant="determinate"
                                        value={fatigueLevel}
                                        sx={{
                                            flex: 1,
                                            height: 10,
                                            borderRadius: 5,
                                            backgroundColor: '#e0e0e0',
                                            '& .MuiLinearProgress-bar': {
                                                backgroundColor: getFatigueColor(fatigueLevel),
                                                borderRadius: 5
                                            }
                                        }}
                                    />
                                    <Typography variant="body1" sx={{ fontWeight: 'bold', color: getFatigueColor(fatigueLevel) }}>
                                        {fatigueLevel}%
                                    </Typography>
                                </Box>
                                {fatigueLevel > 70 && (
                                    <Typography variant="caption" sx={{ color: '#f44336', mt: 1, display: 'block' }}>
                                        ⚠️ Fatigue is accumulating. Taking a break is recommended.
                                    </Typography>
                                )}
                            </Paper>
                        </Grid>
                    )}

                    {/* Appearance Information (own player only) */}
                    {isOwnPlayer && (
                        <Grid item xs={12}>
                            <Paper elevation={1} sx={{ p: 2, backgroundColor: '#f8f9fa' }}>
                                <Typography variant="h6" sx={{ fontSize: '16px', fontWeight: 'bold', mb: 2 }}>
                                    👔 Appearance
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <Typography variant="body2" color="text.secondary">
                                            Clothing
                                        </Typography>
                                        <Chip 
                                            label={getClothingDisplay(currentClothing)} 
                                            size="small" 
                                            sx={{ mt: 0.5 }}
                                        />
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="body2" color="text.secondary">
                                            Accessory
                                        </Typography>
                                        <Chip 
                                            label={getAccessoryDisplay(currentAccessory)} 
                                            size="small" 
                                            sx={{ mt: 0.5 }}
                                        />
                                    </Grid>
                                </Grid>
                            </Paper>
                        </Grid>
                    )}

                    {/* Labor Standards Check (own player only) */}
                    {isOwnPlayer && workDuration > 8 * 60 * 60 * 1000 && (
                        <Grid item xs={12}>
                            <Paper elevation={1} sx={{ p: 2, backgroundColor: '#ffebee', border: '1px solid #f44336' }}>
                                <Typography variant="h6" sx={{ fontSize: '16px', fontWeight: 'bold', color: '#f44336', mb: 1 }}>
                                    ⚠️ Working Hours Notice
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#f44336' }}>
                                    Today's work time exceeds 8 hours. It is recommended to take appropriate breaks in accordance with labor standards.
                                </Typography>
                            </Paper>
                        </Grid>
                    )}
                </Grid>
            </DialogContent>

            <Divider />

            <DialogActions sx={{ p: 2, gap: 1 }}>
                {isOwnPlayer && (
                    <>
                        {currentWorkStatus === 'off-duty' && (
                            <Button
                                variant="contained"
                                onClick={() => handleStatusChange('working')}
                                sx={{ backgroundColor: '#4caf50' }}
                            >
                                🏢 Clock In
                            </Button>
                        )}
                        {currentWorkStatus === 'working' && (
                            <>
                                <Button
                                    variant="outlined"
                                    onClick={() => handleStatusChange('break')}
                                    sx={{ color: '#f57c00', borderColor: '#f57c00' }}
                                >
                                    ☕ Break
                                </Button>
                                <Button
                                    variant="contained"
                                    color="error"
                                    onClick={() => handleStatusChange('off-duty')}
                                >
                                    🏠 Clock Out
                                </Button>
                            </>
                        )}
                        {currentWorkStatus === 'break' && (
                            <Button
                                variant="contained"
                                onClick={() => handleStatusChange('working')}
                                sx={{ backgroundColor: '#1976d2' }}
                            >
                                💼 Resume Work
                            </Button>
                        )}
                    </>
                )}
                <Button onClick={onClose} variant="outlined">
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    )
}

export default PlayerStatusModal