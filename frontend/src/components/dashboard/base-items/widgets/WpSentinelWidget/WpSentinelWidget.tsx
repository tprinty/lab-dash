import { Box, Card, CardContent, Chip, CircularProgress, Typography } from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';

import { DashApi } from '../../../../../api/dash-api';
import { COLORS } from '../../../../../theme/styles';

interface AlertData {
    site: string;
    type: string;
    level: string;
    title: string;
    created_at: string;
}

interface SummaryData {
    total_clients: number;
    total_sites: number;
    sites_online: number;
    sites_offline: number;
    active_alerts: number;
    uptime_percent: number | null;
}

interface WpSentinelData {
    summary: SummaryData;
    alerts: AlertData[];
    lastUpdated: string;
}

interface WpSentinelWidgetProps {
    config?: {
        apiUrl?: string;
        apiKey?: string;
        refreshInterval?: number;
        showLabel?: boolean;
        displayName?: string;
    };
}

export const WpSentinelWidget: React.FC<WpSentinelWidgetProps> = ({ config }) => {
    const [data, setData] = useState<WpSentinelData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const timerRef = useRef<number | null>(null);

    const refreshInterval = config?.refreshInterval || 300000;

    const fetchData = async () => {
        try {
            const result = await DashApi.getWpSentinelData({
                apiUrl: config?.apiUrl,
                apiKey: config?.apiKey
            });
            setData(result);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to load WP Sentinel data');
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
    }, [refreshInterval, config?.apiUrl, config?.apiKey]);

    if (isLoading) {
        return (
            <Card sx={{ backgroundColor: COLORS.GRAY, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
                <CircularProgress size={32} />
            </Card>
        );
    }

    if (error) {
        return (
            <Card sx={{ backgroundColor: COLORS.GRAY, height: '100%', minHeight: 200, p: 2 }}>
                <CardContent>
                    <Typography variant="subtitle2" sx={{ color: '#ff6b6b' }}>
                        {config?.displayName || 'WP Sentinel'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#999', mt: 1, display: 'block' }}>
                        {error}
                    </Typography>
                </CardContent>
            </Card>
        );
    }

    if (!data) return null;

    const { summary, alerts } = data;
    const hasAlerts = summary.active_alerts > 0;
    const uptimeColor = summary.uptime_percent === null ? '#888' :
        summary.uptime_percent >= 99 ? '#4caf50' :
        summary.uptime_percent >= 95 ? '#ff9800' : '#f44336';

    return (
        <Card sx={{ backgroundColor: COLORS.GRAY, height: '100%', minHeight: 200 }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                {config?.showLabel !== false && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                        <Typography variant="subtitle2" sx={{ color: '#aaa', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {config?.displayName || 'WP Sentinel'}
                        </Typography>
                        {hasAlerts && (
                            <Chip
                                label={`${summary.active_alerts} alert${summary.active_alerts !== 1 ? 's' : ''}`}
                                size="small"
                                sx={{
                                    backgroundColor: 'rgba(244,67,54,0.2)',
                                    color: '#f44336',
                                    fontWeight: 600,
                                    fontSize: '0.65rem',
                                    height: 20
                                }}
                            />
                        )}
                    </Box>
                )}

                {/* Stats Row */}
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Box sx={{ flex: 1, textAlign: 'center' }}>
                        <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: '1.1rem' }}>
                            {summary.total_sites}
                        </Typography>
                        <Typography sx={{ color: '#888', fontSize: '0.65rem' }}>Sites</Typography>
                    </Box>
                    <Box sx={{ flex: 1, textAlign: 'center' }}>
                        <Typography sx={{ color: '#4caf50', fontWeight: 600, fontSize: '1.1rem' }}>
                            {summary.sites_online}
                        </Typography>
                        <Typography sx={{ color: '#888', fontSize: '0.65rem' }}>Online</Typography>
                    </Box>
                    {summary.sites_offline > 0 && (
                        <Box sx={{ flex: 1, textAlign: 'center' }}>
                            <Typography sx={{ color: '#f44336', fontWeight: 600, fontSize: '1.1rem' }}>
                                {summary.sites_offline}
                            </Typography>
                            <Typography sx={{ color: '#888', fontSize: '0.65rem' }}>Offline</Typography>
                        </Box>
                    )}
                    <Box sx={{ flex: 1, textAlign: 'center' }}>
                        <Typography sx={{ color: uptimeColor, fontWeight: 600, fontSize: '1.1rem' }}>
                            {summary.uptime_percent !== null ? `${summary.uptime_percent}%` : '—'}
                        </Typography>
                        <Typography sx={{ color: '#888', fontSize: '0.65rem' }}>Uptime</Typography>
                    </Box>
                </Box>

                {/* Recent Alerts */}
                {alerts.length > 0 && (
                    <Box>
                        <Typography sx={{ color: '#aaa', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', mb: 0.5 }}>
                            Recent Alerts
                        </Typography>
                        {alerts.slice(0, 3).map((alert, idx) => {
                            const levelColor = alert.level === 'critical' ? '#f44336' :
                                alert.level === 'warning' ? '#ff9800' : '#42a5f5';
                            return (
                                <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.3 }}>
                                    <Typography sx={{ color: '#ccc', fontSize: '0.7rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                                        <Box component="span" sx={{ color: levelColor, mr: 0.5 }}>●</Box>
                                        {alert.site}: {alert.title}
                                    </Typography>
                                    <Typography sx={{ color: '#666', fontSize: '0.6rem', ml: 1, whiteSpace: 'nowrap' }}>
                                        {alert.type}
                                    </Typography>
                                </Box>
                            );
                        })}
                    </Box>
                )}

                {alerts.length === 0 && !hasAlerts && (
                    <Box sx={{ textAlign: 'center', py: 1 }}>
                        <Typography sx={{ color: '#4caf50', fontSize: '0.75rem' }}>
                            ✓ All sites healthy
                        </Typography>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
};
