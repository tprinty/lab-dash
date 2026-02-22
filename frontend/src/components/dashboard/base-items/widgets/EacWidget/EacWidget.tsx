import { Box, Card, CardContent, CircularProgress, LinearProgress, Typography } from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';

import { DashApi } from '../../../../../api/dash-api';
import { COLORS } from '../../../../../theme/styles';

interface ClientData {
    name: string;
    domain: string;
    monthlyRate: number;
}

interface EacData {
    pipeline: {
        prospects: number;
        wordpressSites: number;
        hotLeads: number;
    };
    revenue: {
        clientCount: number;
        mrr: number;
        arr: number;
        targetPercent: number;
        revenueTarget: number;
        clients: ClientData[];
    };
    lastUpdated: string | null;
}

interface EacWidgetProps {
    config?: {
        dbHost?: string;
        dbPort?: number;
        clients?: ClientData[];
        revenueTarget?: number;
        refreshInterval?: number;
        showLabel?: boolean;
        displayName?: string;
    };
}

const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
};

const formatNumber = (value: number): string => {
    return new Intl.NumberFormat('en-US').format(value);
};

export const EacWidget: React.FC<EacWidgetProps> = ({ config }) => {
    const [data, setData] = useState<EacData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const timerRef = useRef<number | null>(null);

    const refreshInterval = config?.refreshInterval || 300000; // 5 min default

    const fetchData = async () => {
        try {
            const result = await DashApi.getEacData({
                dbHost: config?.dbHost,
                dbPort: config?.dbPort,
                clients: config?.clients || [],
                revenueTarget: config?.revenueTarget || 40000
            });
            setData(result);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to load EAC data');
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
    }, [refreshInterval, config?.dbHost, config?.dbPort]);

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
                        {config?.displayName || 'EAC Business'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#999', mt: 1, display: 'block' }}>
                        {error}
                    </Typography>
                </CardContent>
            </Card>
        );
    }

    if (!data) return null;

    const { revenue, pipeline } = data;
    const progressColor = revenue.targetPercent >= 100 ? '#4caf50' : revenue.targetPercent >= 50 ? '#ff9800' : '#f44336';

    return (
        <Card sx={{ backgroundColor: COLORS.GRAY, height: '100%', minHeight: 200 }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                {config?.showLabel !== false && (
                    <Typography variant="subtitle2" sx={{ color: '#aaa', mb: 1.5, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {config?.displayName || 'EAC Business'}
                    </Typography>
                )}

                {/* Revenue Section */}
                <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 0.5 }}>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: '#fff' }}>
                            {formatCurrency(revenue.mrr)}
                            <Typography component="span" sx={{ color: '#888', fontSize: '0.75rem', ml: 0.5 }}>/mo</Typography>
                        </Typography>
                        <Typography sx={{ color: '#aaa', fontSize: '0.75rem' }}>
                            {revenue.clientCount} clients
                        </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                        <Typography sx={{ color: '#888', fontSize: '0.7rem' }}>
                            {formatCurrency(revenue.arr)}/yr → {formatCurrency(revenue.revenueTarget)} target
                        </Typography>
                        <Typography sx={{ color: progressColor, fontSize: '0.75rem', fontWeight: 600 }}>
                            {revenue.targetPercent}%
                        </Typography>
                    </Box>

                    <LinearProgress
                        variant="determinate"
                        value={Math.min(revenue.targetPercent, 100)}
                        sx={{
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: 'rgba(255,255,255,0.1)',
                            '& .MuiLinearProgress-bar': {
                                borderRadius: 3,
                                backgroundColor: progressColor
                            }
                        }}
                    />
                </Box>

                {/* Pipeline Section */}
                <Box>
                    <Typography sx={{ color: '#aaa', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', mb: 0.5 }}>
                        Pipeline
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Box sx={{ flex: 1, textAlign: 'center' }}>
                            <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: '1.1rem' }}>
                                {formatNumber(pipeline.prospects)}
                            </Typography>
                            <Typography sx={{ color: '#888', fontSize: '0.65rem' }}>Prospects</Typography>
                        </Box>
                        <Box sx={{ flex: 1, textAlign: 'center' }}>
                            <Typography sx={{ color: '#42a5f5', fontWeight: 600, fontSize: '1.1rem' }}>
                                {formatNumber(pipeline.wordpressSites)}
                            </Typography>
                            <Typography sx={{ color: '#888', fontSize: '0.65rem' }}>WordPress</Typography>
                        </Box>
                        <Box sx={{ flex: 1, textAlign: 'center' }}>
                            <Typography sx={{ color: '#ff9800', fontWeight: 600, fontSize: '1.1rem' }}>
                                {formatNumber(pipeline.hotLeads)}
                            </Typography>
                            <Typography sx={{ color: '#888', fontSize: '0.65rem' }}>Hot Leads</Typography>
                        </Box>
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
};
