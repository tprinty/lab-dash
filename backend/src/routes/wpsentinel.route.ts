import { Request, Response, Router } from 'express';
import axios from 'axios';

import { authenticateToken } from '../middleware/auth.middleware';

export const wpSentinelRoute = Router();

// POST /data - Get WP Sentinel dashboard data via API proxy
wpSentinelRoute.post('/data', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            apiUrl = 'http://192.168.2.9:8090',
            apiKey = ''
        } = req.body;

        if (!apiKey) {
            res.status(400).json({ error: 'API key is required' });
            return;
        }

        const headers = {
            'Authorization': `Bearer ${apiKey}`,
            'Accept': 'application/json'
        };

        const timeout = 10000;

        // Fetch summary and alerts in parallel
        const [summaryRes, alertsRes] = await Promise.allSettled([
            axios.get(`${apiUrl}/api/v1/dashboard/summary`, { headers, timeout }),
            axios.get(`${apiUrl}/api/v1/dashboard/alerts?limit=5`, { headers, timeout })
        ]);

        const summary = summaryRes.status === 'fulfilled' ? summaryRes.value.data?.data : null;
        const alerts = alertsRes.status === 'fulfilled' ? alertsRes.value.data?.data : [];

        res.json({
            summary: summary || {
                total_clients: 0,
                total_sites: 0,
                sites_online: 0,
                sites_offline: 0,
                active_alerts: 0,
                uptime_percent: null
            },
            alerts: Array.isArray(alerts) ? alerts : [],
            lastUpdated: new Date().toISOString()
        });
    } catch (error: any) {
        console.error('WP Sentinel data error:', error.message);
        res.status(500).json({ error: 'Failed to fetch WP Sentinel data' });
    }
});
