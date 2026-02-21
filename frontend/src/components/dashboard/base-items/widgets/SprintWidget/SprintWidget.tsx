import { Box, CircularProgress, LinearProgress, Typography } from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';
import { FaCheck, FaTimes, FaSpinner, FaMinus } from 'react-icons/fa';

import { DashApi } from '../../../../../api/dash-api';
import { COLORS } from '../../../../../theme/styles';

interface RepoSprint {
    name: string;
    fullName: string;
    url: string;
    openIssues: number;
    closedIssues: number;
    totalIssues: number;
    progressPercent: number;
    lastCommit: {
        message: string;
        date: string;
        author: string;
    } | null;
    topIssue: {
        title: string;
        number: number;
        url: string;
    } | null;
    ciStatus: 'passing' | 'failing' | 'pending' | 'none';
    ciUrl: string | null;
}

interface SprintData {
    repos: RepoSprint[];
    lastUpdated: string;
}

interface SprintWidgetProps {
    config?: {
        refreshInterval?: number;
        showLabel?: boolean;
        displayName?: string;
    };
    itemId?: string;
}

const getRelativeTime = (dateStr: string): string => {
    if (!dateStr) return '';
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diffMs = now - then;
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
};

const CIBadge: React.FC<{ status: string }> = ({ status }) => {
    switch (status) {
    case 'passing':
        return <FaCheck size={10} color="#4caf50" />;
    case 'failing':
        return <FaTimes size={10} color="#f44336" />;
    case 'pending':
        return <FaSpinner size={10} color="#ff9800" />;
    default:
        return <FaMinus size={10} color="#666" />;
    }
};

export const SprintWidget: React.FC<SprintWidgetProps> = ({ config, itemId }) => {
    const [data, setData] = useState<SprintData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const timerRef = useRef<number | null>(null);

    const refreshInterval = config?.refreshInterval || 900000; // 15 min default

    const fetchData = async () => {
        if (!itemId) {
            setError('No item ID');
            setIsLoading(false);
            return;
        }
        try {
            const result = await DashApi.getSprintData(itemId);
            setData(result);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to load sprint data');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        timerRef.current = window.setInterval(fetchData, refreshInterval);
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [refreshInterval, itemId]);

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: 120 }}>
                <CircularProgress size={28} />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="error">{error}</Typography>
            </Box>
        );
    }

    if (!data) return null;

    return (
        <Box sx={{ p: 1.5 }}>
            {data.repos.map((repo) => (
                <Box
                    key={repo.fullName}
                    sx={{
                        mb: 1.5,
                        pb: 1,
                        borderBottom: '1px solid rgba(255,255,255,0.08)',
                        '&:last-child': { borderBottom: 'none', mb: 0, pb: 0 }
                    }}
                >
                    {/* Repo header with name and CI badge */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography
                            variant="caption"
                            sx={{
                                color: '#fff',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                            }}
                        >
                            {repo.name}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <CIBadge status={repo.ciStatus} />
                        </Box>
                    </Box>

                    {/* Progress bar */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <LinearProgress
                            variant="determinate"
                            value={repo.progressPercent}
                            sx={{
                                flex: 1,
                                height: 6,
                                borderRadius: 3,
                                bgcolor: 'rgba(255,255,255,0.08)',
                                '& .MuiLinearProgress-bar': {
                                    bgcolor: repo.progressPercent === 100 ? '#4caf50' : '#2196f3',
                                    borderRadius: 3,
                                }
                            }}
                        />
                        <Typography
                            variant="caption"
                            sx={{
                                color: COLORS.LIGHT_GRAY,
                                fontSize: '0.6rem',
                                minWidth: 45,
                                textAlign: 'right',
                            }}
                        >
                            {repo.closedIssues}/{repo.totalIssues} ({repo.progressPercent}%)
                        </Typography>
                    </Box>

                    {/* Last commit */}
                    {repo.lastCommit && (
                        <Typography
                            variant="caption"
                            sx={{
                                color: 'rgba(255,255,255,0.4)',
                                fontSize: '0.6rem',
                                display: 'block',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            📝 {repo.lastCommit.message.substring(0, 40)}{repo.lastCommit.message.length > 40 ? '…' : ''} · {getRelativeTime(repo.lastCommit.date)}
                        </Typography>
                    )}

                    {/* Top issue */}
                    {repo.topIssue && (
                        <Typography
                            variant="caption"
                            sx={{
                                color: 'rgba(255,255,255,0.4)',
                                fontSize: '0.6rem',
                                display: 'block',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            🎯 #{repo.topIssue.number}: {repo.topIssue.title.substring(0, 35)}{repo.topIssue.title.length > 35 ? '…' : ''}
                        </Typography>
                    )}
                </Box>
            ))}

            {data.lastUpdated && (
                <Typography
                    variant="caption"
                    sx={{
                        color: 'rgba(255,255,255,0.3)',
                        fontSize: '0.6rem',
                        display: 'block',
                        mt: 0.5,
                        textAlign: 'right',
                    }}
                >
                    {data.lastUpdated}
                </Typography>
            )}
        </Box>
    );
};
