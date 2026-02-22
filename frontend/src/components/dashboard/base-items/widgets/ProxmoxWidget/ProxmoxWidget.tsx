import { Box, Card, CardContent, CircularProgress, LinearProgress, Typography } from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';

import { DashApi } from '../../../../../api/dash-api';
import { COLORS } from '../../../../../theme/styles';

interface VmData {
    vmid: number;
    name: string;
    status: string;
    type: string;
    cpu: number;
    memPercent: number;
    memUsed: number;
    memTotal: number;
    uptime: number;
    node: string;
}

interface NodeData {
    name: string;
    status: string;
    cpu: number;
    memPercent: number;
    uptime: number;
}

interface DockerContainer {
    id: string;
    name: string;
    image: string;
    status: string;
    statusText: string;
    restartCount: number;
}

interface ProxmoxData {
    nodes: NodeData[];
    vms: VmData[];
    lxcContainers: VmData[];
    dockerContainers: DockerContainer[];
    proxmoxError: string | null;
    dockerError: string | null;
    lastUpdated: string | null;
}

interface ProxmoxWidgetProps {
    config?: {
        proxmoxHost?: string;
        proxmoxPort?: number;
        proxmoxTokenId?: string;
        proxmoxTokenSecret?: string;
        dockerHost?: string;
        refreshInterval?: number;
        showLabel?: boolean;
        displayName?: string;
    };
}

const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb >= 1) return `${gb.toFixed(1)} GB`;
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(0)} MB`;
};

const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    if (days > 0) return `${days}d ${hours}h`;
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
};

const statusColor = (status: string): string => {
    if (status === 'running' || status === 'online') return '#4caf50';
    if (status === 'stopped' || status === 'offline') return '#f44336';
    return '#9e9e9e';
};

const dockerStatusColor = (status: string): string => {
    if (status === 'running') return '#4caf50';
    if (status === 'exited' || status === 'dead') return '#f44336';
    if (status === 'restarting') return '#ff9800';
    if (status === 'paused') return '#ff9800';
    return '#9e9e9e';
};

export const ProxmoxWidget: React.FC<ProxmoxWidgetProps> = ({ config }) => {
    const [data, setData] = useState<ProxmoxData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const fetchData = async () => {
        try {
            const result = await DashApi.getProxmoxData({
                proxmoxHost: config?.proxmoxHost,
                proxmoxPort: config?.proxmoxPort,
                proxmoxTokenId: config?.proxmoxTokenId,
                proxmoxTokenSecret: config?.proxmoxTokenSecret,
                dockerHost: config?.dockerHost
            });
            setData(result);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = config?.refreshInterval || 60000;
        intervalRef.current = setInterval(fetchData, interval);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [config?.proxmoxHost, config?.proxmoxTokenId, config?.refreshInterval]);

    const showLabel = config?.showLabel !== false;
    const displayName = config?.displayName || 'Infrastructure';

    if (loading) {
        return (
            <Card sx={{ backgroundColor: COLORS.GRAY, height: '100%', minHeight: 200 }}>
                <CardContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <CircularProgress size={30} />
                </CardContent>
            </Card>
        );
    }

    if (error && !data) {
        return (
            <Card sx={{ backgroundColor: COLORS.GRAY, height: '100%' }}>
                <CardContent>
                    {showLabel && <Typography variant="subtitle2" sx={{ mb: 1, opacity: 0.7 }}>{displayName}</Typography>}
                    <Typography color="error" variant="body2">{error}</Typography>
                </CardContent>
            </Card>
        );
    }

    const allVms = [...(data?.vms || []), ...(data?.lxcContainers || [])];

    return (
        <Card sx={{ backgroundColor: COLORS.GRAY, height: '100%' }}>
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                {showLabel && (
                    <Typography variant="subtitle2" sx={{ mb: 1, opacity: 0.7, fontSize: '0.75rem' }}>
                        {displayName}
                    </Typography>
                )}

                {/* Node Status */}
                {data?.nodes && data.nodes.length > 0 && (
                    <Box sx={{ mb: 1.5 }}>
                        <Typography variant="caption" sx={{ opacity: 0.5, textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: 1 }}>
                            Proxmox Node
                        </Typography>
                        {data.nodes.map((node) => (
                            <Box key={node.name} sx={{ mt: 0.5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: statusColor(node.status) }} />
                                        <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 500 }}>{node.name}</Typography>
                                    </Box>
                                    <Typography variant="caption" sx={{ opacity: 0.5, fontSize: '0.65rem' }}>
                                        {formatUptime(node.uptime)}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 1.5, mt: 0.5 }}>
                                    <Box sx={{ flex: 1 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
                                            <Typography variant="caption" sx={{ fontSize: '0.6rem', opacity: 0.6 }}>CPU</Typography>
                                            <Typography variant="caption" sx={{ fontSize: '0.6rem', opacity: 0.6 }}>{node.cpu}%</Typography>
                                        </Box>
                                        <LinearProgress variant="determinate" value={node.cpu} sx={{ height: 3, borderRadius: 1, backgroundColor: 'rgba(255,255,255,0.1)', '& .MuiLinearProgress-bar': { backgroundColor: node.cpu > 80 ? '#f44336' : node.cpu > 60 ? '#ff9800' : '#4caf50' } }} />
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
                                            <Typography variant="caption" sx={{ fontSize: '0.6rem', opacity: 0.6 }}>MEM</Typography>
                                            <Typography variant="caption" sx={{ fontSize: '0.6rem', opacity: 0.6 }}>{node.memPercent}%</Typography>
                                        </Box>
                                        <LinearProgress variant="determinate" value={node.memPercent} sx={{ height: 3, borderRadius: 1, backgroundColor: 'rgba(255,255,255,0.1)', '& .MuiLinearProgress-bar': { backgroundColor: node.memPercent > 80 ? '#f44336' : node.memPercent > 60 ? '#ff9800' : '#4caf50' } }} />
                                    </Box>
                                </Box>
                            </Box>
                        ))}
                    </Box>
                )}

                {data?.proxmoxError && !data.nodes.length && (
                    <Typography variant="caption" color="error" sx={{ display: 'block', mb: 1, fontSize: '0.65rem' }}>
                        Proxmox: {data.proxmoxError}
                    </Typography>
                )}

                {/* VMs & LXC */}
                {allVms.length > 0 && (
                    <Box sx={{ mb: 1.5 }}>
                        <Typography variant="caption" sx={{ opacity: 0.5, textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: 1 }}>
                            Virtual Machines
                        </Typography>
                        {allVms.map((vm) => (
                            <Box key={`${vm.type}-${vm.vmid}`} sx={{ mt: 0.5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: statusColor(vm.status) }} />
                                        <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                                            {vm.name}
                                        </Typography>
                                        <Typography variant="caption" sx={{ opacity: 0.3, fontSize: '0.6rem' }}>
                                            {vm.type === 'lxc' ? 'CT' : 'VM'} {vm.vmid}
                                        </Typography>
                                    </Box>
                                    {vm.status === 'running' && (
                                        <Typography variant="caption" sx={{ opacity: 0.4, fontSize: '0.6rem' }}>
                                            {formatBytes(vm.memUsed)}/{formatBytes(vm.memTotal)}
                                        </Typography>
                                    )}
                                </Box>
                                {vm.status === 'running' && (
                                    <Box sx={{ display: 'flex', gap: 1.5, mt: 0.25 }}>
                                        <Box sx={{ flex: 1 }}>
                                            <LinearProgress variant="determinate" value={vm.cpu} sx={{ height: 2, borderRadius: 1, backgroundColor: 'rgba(255,255,255,0.08)', '& .MuiLinearProgress-bar': { backgroundColor: vm.cpu > 80 ? '#f44336' : '#4caf50' } }} />
                                        </Box>
                                        <Box sx={{ flex: 1 }}>
                                            <LinearProgress variant="determinate" value={vm.memPercent} sx={{ height: 2, borderRadius: 1, backgroundColor: 'rgba(255,255,255,0.08)', '& .MuiLinearProgress-bar': { backgroundColor: vm.memPercent > 80 ? '#f44336' : '#4caf50' } }} />
                                        </Box>
                                    </Box>
                                )}
                            </Box>
                        ))}
                    </Box>
                )}

                {/* Docker Containers */}
                {data?.dockerContainers && data.dockerContainers.length > 0 && (
                    <Box>
                        <Typography variant="caption" sx={{ opacity: 0.5, textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: 1 }}>
                            Docker Containers
                        </Typography>
                        {data.dockerContainers.map((c) => (
                            <Box key={c.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: dockerStatusColor(c.status) }} />
                                    <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>{c.name}</Typography>
                                </Box>
                                <Typography variant="caption" sx={{ opacity: 0.4, fontSize: '0.6rem' }}>
                                    {c.statusText}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                )}

                {data?.dockerError && !data.dockerContainers?.length && config?.dockerHost && (
                    <Typography variant="caption" color="error" sx={{ display: 'block', fontSize: '0.65rem' }}>
                        Docker: {data.dockerError}
                    </Typography>
                )}
            </CardContent>
        </Card>
    );
};
