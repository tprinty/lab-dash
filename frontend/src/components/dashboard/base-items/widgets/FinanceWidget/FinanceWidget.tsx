import { Box, Card, CardContent, CircularProgress, Typography } from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';

import { DashApi } from '../../../../../api/dash-api';
import { COLORS } from '../../../../../theme/styles';

interface AccountData {
    name: string;
    balance: number | null;
    date: string | null;
    change: number | null;
    sparkline: number[];
}

interface FinanceData {
    accounts: AccountData[];
    total: {
        balance: number;
        change: number | null;
        sparkline: number[];
    };
    lastUpdated: string | null;
}

interface FinanceWidgetProps {
    config?: {
        csvPath?: string;
        refreshInterval?: number;
        showLabel?: boolean;
        displayName?: string;
    };
}

const formatCurrency = (value: number | null): string => {
    if (value === null) return '—';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
};

const formatChange = (value: number | null): string => {
    if (value === null) return '';
    const sign = value >= 0 ? '+' : '';
    return sign + new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
};

const Sparkline: React.FC<{ data: number[]; color: string; width?: number; height?: number }> = ({ data, color, width = 80, height = 24 }) => {
    if (data.length < 2) return null;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const padding = 2;

    const points = data.map((v, i) => {
        const x = (i / (data.length - 1)) * (width - padding * 2) + padding;
        const y = height - padding - ((v - min) / range) * (height - padding * 2);
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg width={width} height={height} style={{ display: 'block' }}>
            <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export const FinanceWidget: React.FC<FinanceWidgetProps> = ({ config }) => {
    const [data, setData] = useState<FinanceData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const timerRef = useRef<number | null>(null);

    const refreshInterval = config?.refreshInterval || 900000; // 15 min default

    const fetchData = async () => {
        try {
            const result = await DashApi.getFinanceData(config?.csvPath);
            setData(result);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to load finance data');
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
    }, [refreshInterval, config?.csvPath]);

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
            {data.accounts.map((account) => (
                <Box key={account.name} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, py: 0.5 }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="caption" sx={{ color: COLORS.LIGHT_GRAY, fontSize: '0.7rem', display: 'block', lineHeight: 1.2 }}>
                            {account.name}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                                {formatCurrency(account.balance)}
                            </Typography>
                            {account.change !== null && (
                                <Typography
                                    variant="caption"
                                    sx={{
                                        color: account.change >= 0 ? '#4caf50' : '#f44336',
                                        fontSize: '0.65rem',
                                        fontWeight: 500
                                    }}
                                >
                                    {formatChange(account.change)}
                                </Typography>
                            )}
                        </Box>
                    </Box>
                    {account.sparkline.length >= 2 && (
                        <Sparkline
                            data={account.sparkline}
                            color={account.change !== null && account.change >= 0 ? '#4caf50' : '#f44336'}
                        />
                    )}
                </Box>
            ))}

            {/* Total */}
            <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.1)', pt: 1, mt: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                    <Typography variant="caption" sx={{ color: COLORS.LIGHT_GRAY, fontSize: '0.7rem', display: 'block', lineHeight: 1.2 }}>
                        Total
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                        <Typography variant="body1" sx={{ fontWeight: 700, fontSize: '1.05rem' }}>
                            {formatCurrency(data.total.balance)}
                        </Typography>
                        {data.total.change !== null && (
                            <Typography
                                variant="caption"
                                sx={{
                                    color: data.total.change >= 0 ? '#4caf50' : '#f44336',
                                    fontSize: '0.7rem',
                                    fontWeight: 500
                                }}
                            >
                                {formatChange(data.total.change)}
                            </Typography>
                        )}
                    </Box>
                </Box>
                {data.total.sparkline.length >= 2 && (
                    <Sparkline
                        data={data.total.sparkline}
                        color={data.total.change !== null && data.total.change >= 0 ? '#4caf50' : '#f44336'}
                        width={100}
                        height={28}
                    />
                )}
            </Box>

            {data.lastUpdated && (
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.6rem', display: 'block', mt: 0.5, textAlign: 'right' }}>
                    Last: {data.lastUpdated}
                </Typography>
            )}
        </Box>
    );
};
