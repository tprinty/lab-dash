import { Request, Response, Router } from 'express';
import https from 'https';

import { authenticateToken } from '../middleware/auth.middleware';

export const proxmoxRoute = Router();

const agent = new https.Agent({ rejectUnauthorized: false });

interface ProxmoxRequestOptions {
    host: string;
    port: number;
    path: string;
    tokenId: string;
    tokenSecret: string;
}

async function proxmoxGet(options: ProxmoxRequestOptions): Promise<any> {
    const url = `https://${options.host}:${options.port}/api2/json${options.path}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `PVEAPIToken=${options.tokenId}=${options.tokenSecret}`
            },
            // @ts-ignore - node fetch supports agent via dispatcher
            signal: controller.signal,
            // @ts-ignore
            agent
        });

        if (!response.ok) {
            throw new Error(`Proxmox API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data.data;
    } finally {
        clearTimeout(timeout);
    }
}

// POST /data - Get Proxmox & Docker status
proxmoxRoute.post('/data', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            proxmoxHost = '192.168.2.12',
            proxmoxPort = 8006,
            proxmoxTokenId = '',
            proxmoxTokenSecret = '',
            dockerHost = ''
        } = req.body;

        let nodes: any[] = [];
        let vms: any[] = [];
        let containers: any[] = [];
        let proxmoxError: string | null = null;

        // Fetch Proxmox data if credentials provided
        if (proxmoxTokenId && proxmoxTokenSecret) {
            try {
                const reqOpts = {
                    host: proxmoxHost,
                    port: Number(proxmoxPort),
                    tokenId: proxmoxTokenId,
                    tokenSecret: proxmoxTokenSecret,
                    path: ''
                };

                // Get nodes
                const nodeData = await proxmoxGet({ ...reqOpts, path: '/nodes' });
                nodes = (nodeData || []).map((n: any) => ({
                    name: n.node,
                    status: n.status,
                    cpu: n.cpu ? Math.round(n.cpu * 100) : 0,
                    memUsed: n.mem || 0,
                    memTotal: n.maxmem || 0,
                    memPercent: n.maxmem ? Math.round((n.mem / n.maxmem) * 100) : 0,
                    uptime: n.uptime || 0
                }));

                // Get VMs and LXC containers for each node
                for (const node of nodes) {
                    try {
                        const qemuData = await proxmoxGet({ ...reqOpts, path: `/nodes/${node.name}/qemu` });
                        const nodeVms = (qemuData || []).map((vm: any) => ({
                            vmid: vm.vmid,
                            name: vm.name || `VM ${vm.vmid}`,
                            status: vm.status,
                            type: 'qemu',
                            cpu: vm.cpu ? Math.round(vm.cpu * 100) : 0,
                            memUsed: vm.mem || 0,
                            memTotal: vm.maxmem || 0,
                            memPercent: vm.maxmem ? Math.round((vm.mem / vm.maxmem) * 100) : 0,
                            uptime: vm.uptime || 0,
                            node: node.name
                        }));
                        vms.push(...nodeVms);
                    } catch (e) {
                        // Skip if can't fetch VMs for this node
                    }

                    try {
                        const lxcData = await proxmoxGet({ ...reqOpts, path: `/nodes/${node.name}/lxc` });
                        const nodeLxc = (lxcData || []).map((ct: any) => ({
                            vmid: ct.vmid,
                            name: ct.name || `CT ${ct.vmid}`,
                            status: ct.status,
                            type: 'lxc',
                            cpu: ct.cpu ? Math.round(ct.cpu * 100) : 0,
                            memUsed: ct.mem || 0,
                            memTotal: ct.maxmem || 0,
                            memPercent: ct.maxmem ? Math.round((ct.mem / ct.maxmem) * 100) : 0,
                            uptime: ct.uptime || 0,
                            node: node.name
                        }));
                        containers.push(...nodeLxc);
                    } catch (e) {
                        // Skip if can't fetch LXC for this node
                    }
                }

                // Sort VMs by vmid
                vms.sort((a, b) => a.vmid - b.vmid);
                containers.sort((a, b) => a.vmid - b.vmid);
            } catch (e: any) {
                proxmoxError = e.message || 'Failed to connect to Proxmox';
            }
        } else {
            proxmoxError = 'Proxmox API credentials not configured';
        }

        // Fetch Docker data if host provided
        let dockerContainers: any[] = [];
        let dockerError: string | null = null;

        if (dockerHost) {
            try {
                const dockerUrl = `${dockerHost}/containers/json?all=true`;
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 10000);

                const dockerRes = await fetch(dockerUrl, { signal: controller.signal });
                clearTimeout(timeout);

                if (!dockerRes.ok) {
                    throw new Error(`Docker API error: ${dockerRes.status}`);
                }

                const dockerData = await dockerRes.json();
                dockerContainers = (dockerData || []).map((c: any) => ({
                    id: c.Id?.substring(0, 12),
                    name: (c.Names?.[0] || '').replace(/^\//, ''),
                    image: c.Image,
                    status: c.State,
                    statusText: c.Status,
                    restartCount: c.HostConfig?.RestartPolicy?.MaximumRetryCount || 0
                }));
            } catch (e: any) {
                dockerError = e.message || 'Failed to connect to Docker';
            }
        }

        res.json({
            nodes,
            vms,
            lxcContainers: containers,
            dockerContainers,
            proxmoxError,
            dockerError,
            lastUpdated: new Date().toISOString()
        });
    } catch (error: any) {
        console.error('Proxmox route error:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});
