import { Request, Response, Router } from 'express';

import { authenticateToken } from '../middleware/auth.middleware';

export const tangoPapaRoute = Router();

interface TangoPapaRequestConfig {
    apiUrl?: string;
    apiToken?: string;
}

async function tangoPapaGet(baseUrl: string, path: string, token: string): Promise<any> {
    const url = `${baseUrl.replace(/\/$/, '')}/api/v1/dashboard${path}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            },
            signal: controller.signal
        });

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('AUTH_FAILED');
            }
            throw new Error(`TangoPapa API error: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    } finally {
        clearTimeout(timeout);
    }
}

// POST /data - Get TangoPapa dashboard data
tangoPapaRoute.post('/data', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            apiUrl = 'http://192.168.2.9:8088',
            apiToken = ''
        }: TangoPapaRequestConfig = req.body;

        if (!apiToken) {
            res.json({
                summary: { prospects: 0, wordpressSites: 0, hotLeads: 0 },
                hotLeads: [],
                campaigns: null,
                enrichment: null,
                authError: true,
                lastUpdated: new Date().toISOString()
            });
            return;
        }

        const results = await Promise.allSettled([
            tangoPapaGet(apiUrl, '/summary', apiToken),
            tangoPapaGet(apiUrl, '/hot-leads', apiToken),
            tangoPapaGet(apiUrl, '/campaigns', apiToken),
            tangoPapaGet(apiUrl, '/enrichment', apiToken)
        ]);

        // Check for auth failure
        const authFailed = results.some(
            r => r.status === 'rejected' && r.reason?.message === 'AUTH_FAILED'
        );

        if (authFailed) {
            res.json({
                summary: { prospects: 0, wordpressSites: 0, hotLeads: 0 },
                hotLeads: [],
                campaigns: null,
                enrichment: null,
                authError: true,
                lastUpdated: new Date().toISOString()
            });
            return;
        }

        const summary = results[0].status === 'fulfilled' ? results[0].value : { prospects: 0, wordpressSites: 0, hotLeads: 0 };
        const hotLeads = results[1].status === 'fulfilled' ? results[1].value : [];
        const campaigns = results[2].status === 'fulfilled' ? results[2].value : null;
        const enrichment = results[3].status === 'fulfilled' ? results[3].value : null;

        res.json({
            summary,
            hotLeads: Array.isArray(hotLeads) ? hotLeads.slice(0, 5) : (hotLeads?.data || []).slice(0, 5),
            campaigns,
            enrichment,
            authError: false,
            lastUpdated: new Date().toISOString()
        });
    } catch (error: any) {
        console.error('TangoPapa data error:', error);
        res.status(500).json({ error: 'Failed to fetch TangoPapa data' });
    }
});
