import { Request, Response, Router } from 'express';
import { Pool } from 'pg';

import { authenticateToken } from '../middleware/auth.middleware';

export const eacRoute = Router();

// POST /data - Get EAC business dashboard data
eacRoute.post('/data', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            dbHost = '127.0.0.1',
            dbPort = 5436,
            clients = [],
            revenueTarget = 40000
        } = req.body;

        // Calculate revenue metrics from config-provided client list
        const clientCount = clients.length;
        const mrr = clients.reduce((sum: number, c: any) => sum + (Number(c.monthlyRate) || 0), 0);
        const arr = mrr * 12;
        const targetPercent = revenueTarget > 0 ? Math.round((arr / revenueTarget) * 100) : 0;

        // Fetch pipeline stats from TangoPapa database
        let pipeline = { prospects: 0, wordpressSites: 0, hotLeads: 0 };

        try {
            const pool = new Pool({
                host: dbHost,
                port: Number(dbPort),
                database: 'tangopapa',
                user: 'tangopapa_app',
                password: 'tangopapa_app_2026',
                connectionTimeoutMillis: 5000,
                query_timeout: 10000
            });

            const [totalRes, wpRes, hotRes] = await Promise.all([
                pool.query('SELECT COUNT(*) as count FROM prospects'),
                pool.query('SELECT COUNT(*) as count FROM prospects WHERE is_wordpress = true'),
                pool.query('SELECT COUNT(*) as count FROM prospects WHERE is_hot_lead = true')
            ]);

            pipeline = {
                prospects: parseInt(totalRes.rows[0].count, 10),
                wordpressSites: parseInt(wpRes.rows[0].count, 10),
                hotLeads: parseInt(hotRes.rows[0].count, 10)
            };

            await pool.end();
        } catch (dbError: any) {
            console.error('TangoPapa DB error (non-fatal):', dbError.message);
            // Pipeline stats will be 0 — widget still shows revenue data
        }

        res.json({
            pipeline,
            revenue: {
                clientCount,
                mrr,
                arr,
                targetPercent,
                revenueTarget,
                clients: clients.map((c: any) => ({ name: c.name, domain: c.domain, monthlyRate: Number(c.monthlyRate) || 0 }))
            },
            lastUpdated: new Date().toISOString()
        });
    } catch (error: any) {
        console.error('EAC data error:', error);
        res.status(500).json({ error: 'Failed to fetch EAC data' });
    }
});
