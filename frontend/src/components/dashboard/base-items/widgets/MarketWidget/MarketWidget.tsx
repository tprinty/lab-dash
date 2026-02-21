import { Box, CircularProgress, Typography } from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa';

import { DashApi } from '../../../../../api/dash-api';
import { COLORS } from '../../../../../theme/styles';

interface AssetData {
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
}

interface MarketData {
    assets: AssetData[];
    lastUpdated: string;
}

interface MarketWidgetProps {
    config?: {
        refreshInterval?: number;
        enabledAssets?: string[];
        showLabel?: boolean;
        displayName?: string;
    };
}

const formatPrice = (price: number, symbol: string): string => {
    if (symbol === 'BTC-USD') {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(price);
    }
    if (['GC=F', 'SI=F'].includes(symbol)) {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(price);
    }
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(price);
};

const formatPercent = (value: number): string => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
};

export const MarketWidget: React.FC<MarketWidgetProps> = ({ config }) => {
    const [data, setData] = useState<MarketData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const timerRef = useRef<number | null>(null);

    const refreshInterval = config?.refreshInterval || 300000; // 5 min default

    const fetchData = async () => {
        try {
            const result = await DashApi.getMarketData(config?.enabledAssets);
            setData(result);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to load market data');
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
    }, [refreshInterval]);

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
            {data.assets.map((asset) => {
                const isPositive = asset.changePercent >= 0;
                const color = isPositive ? '#4caf50' : '#f44336';

                return (
                    <Box
                        key={asset.symbol}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            mb: 0.5,
                            py: 0.3,
                        }}
                    >
                        <Box sx={{ flex: '0 0 auto', minWidth: 70 }}>
                            <Typography
                                variant="caption"
                                sx={{
                                    color: COLORS.LIGHT_GRAY,
                                    fontSize: '0.65rem',
                                    fontWeight: 600,
                                    letterSpacing: '0.02em',
                                }}
                            >
                                {asset.name}
                            </Typography>
                        </Box>

                        <Box sx={{ flex: 1, textAlign: 'right', mr: 1 }}>
                            <Typography
                                variant="body2"
                                sx={{ fontWeight: 600, fontSize: '0.8rem' }}
                            >
                                {formatPrice(asset.price, asset.symbol)}
                            </Typography>
                        </Box>

                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.3,
                                minWidth: 72,
                                justifyContent: 'flex-end',
                            }}
                        >
                            {isPositive ? (
                                <FaArrowUp size={8} color={color} />
                            ) : (
                                <FaArrowDown size={8} color={color} />
                            )}
                            <Typography
                                variant="caption"
                                sx={{
                                    color,
                                    fontSize: '0.7rem',
                                    fontWeight: 600,
                                }}
                            >
                                {formatPercent(asset.changePercent)}
                            </Typography>
                        </Box>
                    </Box>
                );
            })}

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
