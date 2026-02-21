import { Request, Response, Router } from 'express';

import { authenticateToken } from '../middleware/auth.middleware';

export const marketRoute = Router();

interface AssetConfig {
    symbol: string;
    name: string;
}

const DEFAULT_ASSETS: AssetConfig[] = [
    { symbol: '^GSPC', name: 'S&P 500' },
    { symbol: '^DJI', name: 'Dow' },
    { symbol: '^IXIC', name: 'Nasdaq' },
    { symbol: '^VIX', name: 'VIX' },
    { symbol: 'GC=F', name: 'Gold' },
    { symbol: 'SI=F', name: 'Silver' },
    { symbol: 'BTC-USD', name: 'Bitcoin' },
];

interface CachedData {
    data: any;
    timestamp: number;
}

let cache: CachedData | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function fetchQuote(symbol: string): Promise<{ price: number; change: number; changePercent: number } | null> {
    try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=1d`;
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        if (!response.ok) return null;

        const json = await response.json();
        const result = json?.chart?.result?.[0];
        if (!result) return null;

        const meta = result.meta;
        const price = meta.regularMarketPrice ?? 0;
        const previousClose = meta.chartPreviousClose ?? meta.previousClose ?? price;
        const change = price - previousClose;
        const changePercent = previousClose !== 0 ? (change / previousClose) * 100 : 0;

        return { price, change, changePercent };
    } catch {
        return null;
    }
}

// POST /data - Get market data
marketRoute.post('/data', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const { enabledAssets } = req.body;

        // Check cache
        if (cache && (Date.now() - cache.timestamp) < CACHE_TTL) {
            let assets = cache.data.assets;
            if (enabledAssets && Array.isArray(enabledAssets)) {
                assets = assets.filter((a: any) => enabledAssets.includes(a.symbol));
            }
            res.json({ ...cache.data, assets });
            return;
        }

        // Fetch all assets in parallel
        const results = await Promise.all(
            DEFAULT_ASSETS.map(async (asset) => {
                const quote = await fetchQuote(asset.symbol);
                return {
                    symbol: asset.symbol,
                    name: asset.name,
                    price: quote?.price ?? 0,
                    change: quote?.change ?? 0,
                    changePercent: quote?.changePercent ?? 0,
                };
            })
        );

        const now = new Date();
        const lastUpdated = now.toLocaleString('en-US', {
            timeZone: 'America/Chicago',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });

        const fullData = { assets: results, lastUpdated };

        // Update cache
        cache = { data: fullData, timestamp: Date.now() };

        // Filter if needed
        let assets = results;
        if (enabledAssets && Array.isArray(enabledAssets)) {
            assets = results.filter(a => enabledAssets.includes(a.symbol));
        }

        res.json({ assets, lastUpdated });
    } catch (error) {
        console.error('Error fetching market data:', error);
        res.status(500).json({ error: 'Failed to fetch market data' });
    }
});
