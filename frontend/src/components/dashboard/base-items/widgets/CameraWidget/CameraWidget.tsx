import { Box, CircularProgress, IconButton, Typography } from '@mui/material';
import { ChevronLeft, ChevronRight, Pause, PlayArrow, Videocam, VideocamOff } from '@mui/icons-material';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { DashApi } from '../../../../../api/dash-api';

interface CameraWidgetProps {
    itemId?: string;
    config?: {
        host?: string;
        port?: string;
        username?: string;
        password?: string;
        channels?: string;
        subtype?: string;
        rotationInterval?: number;
        showLabel?: boolean;
        displayName?: string;
    };
}

export const CameraWidget: React.FC<CameraWidgetProps> = ({ itemId, config }) => {
    const channels = (config?.channels || '1,2,3,4').split(',').map(c => c.trim()).filter(Boolean);
    const rotationInterval = config?.rotationInterval || 10000;
    
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const timerRef = useRef<number | null>(null);
    const snapshotTimerRef = useRef<number | null>(null);
    const clickTimeoutRef = useRef<number | null>(null);

    const fetchSnapshot = useCallback(async (channelIndex: number) => {
        try {
            const channel = channels[channelIndex];
            const blob = await DashApi.getCameraSnapshot({
                host: config?.host || '192.168.2.10',
                port: config?.port || '554',
                username: config?.username || 'admin',
                password: config?.password || '',
                channel,
                subtype: config?.subtype || '1',
                itemId: itemId || ''
            });
            const url = URL.createObjectURL(blob);
            setImageUrl(prev => {
                if (prev) URL.revokeObjectURL(prev);
                return url;
            });
            setError(null);
            setIsLoading(false);
        } catch (err: any) {
            setError('Camera unavailable');
            setIsLoading(false);
        }
    }, [config, channels]);

    // Snapshot polling (~1fps)
    useEffect(() => {
        fetchSnapshot(currentIndex);
        snapshotTimerRef.current = window.setInterval(() => {
            fetchSnapshot(currentIndex);
        }, 1500);
        return () => {
            if (snapshotTimerRef.current) clearInterval(snapshotTimerRef.current);
        };
    }, [currentIndex, fetchSnapshot]);

    // Auto-rotation
    useEffect(() => {
        if (isPaused || channels.length <= 1) return;
        timerRef.current = window.setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % channels.length);
        }, rotationInterval);
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isPaused, rotationInterval, channels.length]);

    // Cleanup blob URLs
    useEffect(() => {
        return () => {
            if (imageUrl) URL.revokeObjectURL(imageUrl);
        };
    }, []);

    const handlePrev = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentIndex(prev => (prev - 1 + channels.length) % channels.length);
    };

    const handleNext = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentIndex(prev => (prev + 1) % channels.length);
    };

    const handleClick = () => {
        if (clickTimeoutRef.current) {
            clearTimeout(clickTimeoutRef.current);
            clickTimeoutRef.current = null;
            // Double click - fullscreen
            if (containerRef.current) {
                if (document.fullscreenElement) {
                    document.exitFullscreen();
                } else {
                    containerRef.current.requestFullscreen();
                }
            }
        } else {
            clickTimeoutRef.current = window.setTimeout(() => {
                clickTimeoutRef.current = null;
                setIsPaused(prev => !prev);
            }, 250);
        }
    };

    return (
        <Box
            ref={containerRef}
            onClick={handleClick}
            sx={{
                position: 'relative',
                width: '100%',
                height: '100%',
                minHeight: 200,
                backgroundColor: '#000',
                cursor: 'pointer',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                '&:fullscreen': { backgroundColor: '#000' }
            }}
        >
            {isLoading && !imageUrl && (
                <CircularProgress size={32} sx={{ color: 'rgba(255,255,255,0.7)' }} />
            )}

            {error && !imageUrl && (
                <Box sx={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
                    <VideocamOff sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="body2">{error}</Typography>
                </Box>
            )}

            {imageUrl && (
                <img
                    src={imageUrl}
                    alt={`Camera ${channels[currentIndex]}`}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain'
                    }}
                />
            )}

            {/* Navigation arrows */}
            {channels.length > 1 && (
                <>
                    <IconButton
                        onClick={handlePrev}
                        sx={{
                            position: 'absolute',
                            left: 4,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'rgba(255,255,255,0.7)',
                            backgroundColor: 'rgba(0,0,0,0.3)',
                            '&:hover': { backgroundColor: 'rgba(0,0,0,0.5)' },
                            padding: '4px'
                        }}
                        size="small"
                    >
                        <ChevronLeft />
                    </IconButton>
                    <IconButton
                        onClick={handleNext}
                        sx={{
                            position: 'absolute',
                            right: 4,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'rgba(255,255,255,0.7)',
                            backgroundColor: 'rgba(0,0,0,0.3)',
                            '&:hover': { backgroundColor: 'rgba(0,0,0,0.5)' },
                            padding: '4px'
                        }}
                        size="small"
                    >
                        <ChevronRight />
                    </IconButton>
                </>
            )}

            {/* Bottom overlay: camera name + pause indicator */}
            <Box
                sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    px: 1,
                    py: 0.5,
                    background: 'linear-gradient(transparent, rgba(0,0,0,0.7))'
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Videocam sx={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }} />
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.7rem' }}>
                        Camera {channels[currentIndex]}
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {isPaused && <Pause sx={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }} />}
                    {channels.length > 1 && (
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.6rem' }}>
                            {currentIndex + 1}/{channels.length}
                        </Typography>
                    )}
                </Box>
            </Box>
        </Box>
    );
};
