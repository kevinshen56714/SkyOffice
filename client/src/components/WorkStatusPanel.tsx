import React from 'react'
import { Box, Button, Paper, Typography, Grid } from '@mui/material'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../stores'
import { startWork, endWork, startBreak, endBreak } from '../stores/WorkStore'
import WorkStatusBadge from './WorkStatusBadge'
import WorkTimeCounter from './WorkTimeCounter'
import { useDevLogger } from '../hooks/useDevMode'
import phaserGame from '../PhaserGame'
import Game from '../scenes/Game'

interface WorkStatusPanelProps {
    compact?: boolean
}

const WorkStatusPanel: React.FC<WorkStatusPanelProps> = ({ compact = false }) => {
    const dispatch = useDispatch()
    const { currentWorkStatus, otherPlayersWorkStatus, workStartTime, fatigueLevel } = useSelector((state: RootState) => state.work)
    const logger = useDevLogger('WorkStatusPanel')
    
    // DevMode時のみデバッグログ
    logger.debug('Current state:', {
        currentWorkStatus,
        workStartTime,
        fatigueLevel,
        otherPlayersCount: Object.keys(otherPlayersWorkStatus).length
    })
    
    const handleStartWork = () => {
        logger.info('Starting work...')
        dispatch(startWork())
        const game = phaserGame.scene.keys.game as Game
        if (game?.network) {
            game.network.startWork()
        } else {
            logger.error('Network not available')
        }
    }

    const handleEndWork = () => {
        dispatch(endWork())
        const game = phaserGame.scene.keys.game as Game
        game?.network?.endWork()
    }

    const handleStartBreak = () => {
        dispatch(startBreak())
        const game = phaserGame.scene.keys.game as Game
        game?.network?.startBreak()
    }

    const handleEndBreak = () => {
        dispatch(endBreak())
        const game = phaserGame.scene.keys.game as Game
        game?.network?.endBreak()
    }

    const getStatusCounts = () => {
        const counts = {
            working: 0,
            break: 0,
            meeting: 0,
            overtime: 0,
            'off-duty': 0
        }
        
        // 自分の状態を含める
        counts[currentWorkStatus]++
        
        // 他のプレイヤーの状態をカウント
        Object.values(otherPlayersWorkStatus).forEach(player => {
            counts[player.workStatus]++
        })
        
        return counts
    }

    const statusCounts = getStatusCounts()

    if (compact) {
        logger.debug('Rendering compact view')
        return (
            <Paper
                elevation={2}
                sx={{
                    position: 'absolute',
                    top: 20,
                    left: 20,
                    padding: 1.5,
                    backgroundColor: 'rgba(255, 255, 255, 0.98)',
                    backdropFilter: 'blur(10px)',
                    border: '2px solid #1976d2',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                    zIndex: 2000,
                    minWidth: '200px'
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography variant="h6" sx={{ fontSize: '12px', fontWeight: 'bold' }}>
                        💼 勤務状況
                    </Typography>
                    <WorkStatusBadge workStatus={currentWorkStatus} showLabel={true} />
                </Box>
                
                <Box sx={{ mb: 1 }}>
                    <WorkTimeCounter compact={true} />
                </Box>
                
                <Box sx={{ display: 'flex', gap: 0.5, mt: 1 }}>
                    {currentWorkStatus === 'off-duty' && (
                        <Button size="small" variant="contained" onClick={handleStartWork} sx={{ fontSize: '10px', minWidth: '50px' }}>
                            出勤
                        </Button>
                    )}
                    {currentWorkStatus === 'working' && (
                        <>
                            <Button size="small" variant="outlined" onClick={handleStartBreak} sx={{ fontSize: '10px', minWidth: '40px' }}>
                                休憩
                            </Button>
                            <Button size="small" variant="contained" color="error" onClick={handleEndWork} sx={{ fontSize: '10px', minWidth: '40px' }}>
                                退勤
                            </Button>
                        </>
                    )}
                    {currentWorkStatus === 'break' && (
                        <Button size="small" variant="contained" onClick={handleEndBreak} sx={{ fontSize: '10px', minWidth: '60px' }}>
                            休憩終了
                        </Button>
                    )}
                </Box>
                
                <Box sx={{ mt: 1 }}>
                    <Button 
                        size="small" 
                        variant="outlined" 
                        onClick={() => {
                            logger.info('Opening detailed status')
                            window.dispatchEvent(new CustomEvent('openPlayerStatusModal', { 
                                detail: { playerId: undefined } 
                            }))
                        }}
                        sx={{ fontSize: '9px', minWidth: '80px', width: '100%' }}
                    >
                        📊 詳細ステータス
                    </Button>
                </Box>
            </Paper>
        )
    }

    return (
        <Paper
            elevation={3}
            sx={{
                position: 'absolute',
                bottom: 20,
                right: 20,
                width: 350,
                padding: 2,
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(0, 0, 0, 0.1)',
                zIndex: 1000,
            }}
        >
            <Typography variant="h6" sx={{ fontSize: '16px', fontWeight: 'bold', mb: 2 }}>
                💼 勤務管理パネル
            </Typography>

            {/* 現在の状態 */}
            <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontSize: '12px', mb: 1 }}>
                    現在の状態
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WorkStatusBadge workStatus={currentWorkStatus} />
                    <WorkTimeCounter compact />
                </Box>
            </Box>

            {/* 操作ボタン */}
            <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontSize: '12px', mb: 1 }}>
                    操作
                </Typography>
                <Grid container spacing={1}>
                    <Grid item xs={6}>
                        <Button
                            fullWidth
                            variant={currentWorkStatus === 'off-duty' ? 'contained' : 'outlined'}
                            onClick={handleStartWork}
                            disabled={currentWorkStatus === 'working'}
                            sx={{ fontSize: '11px' }}
                        >
                            🏢 出勤
                        </Button>
                    </Grid>
                    <Grid item xs={6}>
                        <Button
                            fullWidth
                            variant="outlined"
                            color="error"
                            onClick={handleEndWork}
                            disabled={currentWorkStatus === 'off-duty'}
                            sx={{ fontSize: '11px' }}
                        >
                            🏠 退勤
                        </Button>
                    </Grid>
                    <Grid item xs={6}>
                        <Button
                            fullWidth
                            variant={currentWorkStatus === 'break' ? 'outlined' : 'contained'}
                            onClick={currentWorkStatus === 'break' ? handleEndBreak : handleStartBreak}
                            disabled={currentWorkStatus === 'off-duty'}
                            sx={{ fontSize: '11px' }}
                        >
                            {currentWorkStatus === 'break' ? '💼 作業再開' : '☕ 休憩'}
                        </Button>
                    </Grid>
                </Grid>
            </Box>

            {/* チーム状況 */}
            <Box>
                <Typography variant="subtitle2" sx={{ fontSize: '12px', mb: 1 }}>
                    チーム勤務状況
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {statusCounts.working > 0 && (
                        <Typography variant="caption" sx={{ fontSize: '10px', color: '#2e7d32' }}>
                            🟢 勤務中: {statusCounts.working}人
                        </Typography>
                    )}
                    {statusCounts.break > 0 && (
                        <Typography variant="caption" sx={{ fontSize: '10px', color: '#f57c00' }}>
                            🟡 休憩中: {statusCounts.break}人
                        </Typography>
                    )}
                    {statusCounts.meeting > 0 && (
                        <Typography variant="caption" sx={{ fontSize: '10px', color: '#d32f2f' }}>
                            🔴 会議中: {statusCounts.meeting}人
                        </Typography>
                    )}
                    {statusCounts['off-duty'] > 0 && (
                        <Typography variant="caption" sx={{ fontSize: '10px', color: '#616161' }}>
                            ⚫ 退勤済み: {statusCounts['off-duty']}人
                        </Typography>
                    )}
                </Box>
            </Box>
        </Paper>
    )
}

export default WorkStatusPanel