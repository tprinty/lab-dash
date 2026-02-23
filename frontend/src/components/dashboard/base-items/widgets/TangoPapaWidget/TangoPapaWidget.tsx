import { Box, Card, CardContent, CircularProgress, Typography } from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';
import { FaCrosshairs, FaWordpress, FaFire } from 'react-icons/fa';

import { DashApi } from '../../../../../api/dash-api';
import { COLORS } from '../../../../../theme/styles';

interface HotLead {
    name?: string;
    domain?: string;
    score?: number;
}

interface TangoPapaData {
    summary: {
        prospects: number;
        wordpressSites: number;
        hotLeads: number;
    };
    hotLeads: HotLead[];
    campaigns: {
        sent?: number;
        opened?: number;
        clicked?: number;
    } | null;
    enrichment: {
        status?: string;
        pending?: number;
        completed?: number;
    } | null;
    authError: boolean;
    lastUpdated: string | null;
}

interface TangoPapaWidgetProps {
    config?: {
        apiUrl?: string;
        apiToken?: string;
        refreshInterval?: number;
        showLabel?: boolean;
        displayName?: string;
    };
}

const formatNumber = (value: number): string => {
    return new Intl.NumberFormat('en-US').format(value);
};

export const TangoPapaWidget: React.FC<TangoPapaWidgetProps> = ({ config }) => {
    const [data, setData] = useState<TangoPapaData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const timerRef = useRef<number | null>(null);

    const refreshInterval = config?.refreshInterval || 300000;

    const fetchData = async () => {
        try {
            const result = await DashApi.getTangoPapaData({
                apiUrl: config?.apiUrl,
                apiToken: config?.apiToken
            });
            setData(result);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to load TangoPapa data');
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
    }, [refreshInterval, config?.apiUrl, config?.apiToken]);

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
                        {config?.displayName || 'TangoPapa'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#999', mt: 1, display: 'block' }}>
                        {error}
                    </Typography>
                </CardContent>
            </Card>
        );
    }

    if (!data) return null;

    if (data.authError) {
        return (
            <Card sx={{ backgroundColor: COLORS.GRAY, height: '100%', minHeight: 200, p: 2 }}>
                <CardContent>
                    <Typography variant="subtitle2" sx={{ color: '#aaa', mb: 1, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {config?.displayName || 'TangoPapa'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#ff9800' }}>
                        Configure API token in widget settings
                    </Typography>
                </CardContent>
            </Card>
        );
    }

    const { summary, hotLeads, campaigns } = data;

    return (
        <Card sx={{ backgroundColor: COLORS.GRAY, height: '100%', minHeight: 200 }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                {config?.showLabel !== false && (
                    <Typography variant="subtitle2" sx={{ color: '#aaa', mb: 1.5, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {config?.displayName || 'TangoPapa'}
                    </Typography>
                )}

                {/* Pipeline Stats */}
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Box sx={{ flex: 1, textAlign: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mb: 0.3 }}>
                            <FaCrosshairs size={12} color="#aaa" />
                            <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: '1.1rem' }}>
                                {formatNumber(summary.prospects)}
                            </Typography>
                        </Box>
                        <Typography sx={{ color: '#888', fontSize: '0.65rem' }}>Prospects</Typography>
                    </Box>
                    <Box sx={{ flex: 1, textAlign: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mb: 0.3 }}>
                            <FaWordpress size={12} color="#42a5f5" />
                            <Typography sx={{ color: '#42a5f5', fontWeight: 600, fontSize: '1.1rem' }}>
                                {formatNumber(summary.wordpressSites)}
                            </Typography>
                        </Box>
                        <Typography sx={{ color: '#888', fontSize: '0.65rem' }}>WordPress</Typography>
                    </Box>
                    <Box sx={{ flex: 1, textAlign: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mb: 0.3 }}>
                            <FaFire size={12} color="#ff9800" />
                            <Typography sx={{ color: '#ff9800', fontWeight: 600, fontSize: '1.1rem' }}>
                                {formatNumber(summary.hotLeads)}
                            </Typography>
                        </Box>
                        <Typography sx={{ color: '#888', fontSize: '0.65rem' }}>Hot Leads</Typography>
                    </Box>
                </Box>

                {/* Campaign Stats */}
                {campaigns && (campaigns.sent || campaigns.opened || campaigns.clicked) && (
                    <Box sx={{ mb: 2 }}>
                        <Typography sx={{ color: '#aaa', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', mb: 0.5 }}>
                            Campaigns
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Box sx={{ flex: 1, textAlign: 'center' }}>
                                <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>
                                    {formatNumber(campaigns.sent || 0)}
                                </Typography>
                                <Typography sx={{ color: '#888', fontSize: '0.6rem' }}>Sent</Typography>
                            </Box>
                            <Box sx={{ flex: 1, textAlign: 'center' }}>
                                <Typography sx={{ color: '#66bb6a', fontWeight: 600, fontSize: '0.9rem' }}>
                                    {formatNumber(campaigns.opened || 0)}
                                </Typography>
                                <Typography sx={{ color: '#888', fontSize: '0.6rem' }}>Opened</Typography>
                            </Box>
                            <Box sx={{ flex: 1, textAlign: 'center' }}>
                                <Typography sx={{ color: '#42a5f5', fontWeight: 600, fontSize: '0.9rem' }}>
                                    {formatNumber(campaigns.clicked || 0)}
                                </Typography>
                                <Typography sx={{ color: '#888', fontSize: '0.6rem' }}>Clicked</Typography>
                            </Box>
                        </Box>
                    </Box>
                )}

                {/* Hot Leads List */}
                {hotLeads.length > 0 && (
                    <Box>
                        <Typography sx={{ color: '#aaa', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', mb: 0.5 }}>
                            Recent Hot Leads
                        </Typography>
                        {hotLeads.map((lead, i) => (
                            <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.3 }}>
                                <Typography sx={{ color: '#ddd', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
                                    {lead.name || lead.domain || 'Unknown'}
                                </Typography>
                                {lead.score !== undefined && (
                                    <Typography sx={{ color: '#ff9800', fontSize: '0.7rem', fontWeight: 600 }}>
                                        {lead.score}
                                    </Typography>
                                )}
                            </Box>
                        ))}
                    </Box>
                )}
            </CardContent>
        </Card>
    );
};
