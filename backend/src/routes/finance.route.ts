import { Request, Response, Router } from 'express';
import * as fs from 'fs';
import * as path from 'path';

import { authenticateToken } from '../middleware/auth.middleware';

export const financeRoute = Router();

interface BalanceRow {
    date: string;
    pnc_a: number | null;
    pnc_b: number | null;
    fifth_third: number | null;
    total: number | null;
}

function parseCSV(filePath: string): BalanceRow[] {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.trim().split('\n');
    // Skip header
    const rows: BalanceRow[] = [];
    for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',');
        rows.push({
            date: cols[0],
            pnc_a: cols[1] ? parseFloat(cols[1]) : null,
            pnc_b: cols[2] ? parseFloat(cols[2]) : null,
            fifth_third: cols[3] ? parseFloat(cols[3]) : null,
            total: cols[4] ? parseFloat(cols[4]) : null
        });
    }
    return rows;
}

function getLatestValue(rows: BalanceRow[], field: keyof Omit<BalanceRow, 'date'>): { value: number | null; date: string | null } {
    for (let i = rows.length - 1; i >= 0; i--) {
        if (rows[i][field] !== null) {
            return { value: rows[i][field] as number, date: rows[i].date };
        }
    }
    return { value: null, date: null };
}

function getPreviousValue(rows: BalanceRow[], field: keyof Omit<BalanceRow, 'date'>, latestDate: string | null): number | null {
    if (!latestDate) return null;
    let foundLatest = false;
    for (let i = rows.length - 1; i >= 0; i--) {
        if (rows[i].date === latestDate && rows[i][field] !== null) {
            foundLatest = true;
            continue;
        }
        if (foundLatest && rows[i][field] !== null) {
            return rows[i][field] as number;
        }
    }
    return null;
}

function getSparklineData(rows: BalanceRow[], field: keyof Omit<BalanceRow, 'date'>, points: number = 7): number[] {
    const values: number[] = [];
    for (let i = rows.length - 1; i >= 0 && values.length < points; i--) {
        if (rows[i][field] !== null) {
            values.unshift(rows[i][field] as number);
        }
    }
    return values;
}

// POST /data - Get finance data
financeRoute.post('/data', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const { csvPath } = req.body;
        const filePath = csvPath || '/home/tprinty/clawd/data/balances.csv';

        if (!fs.existsSync(filePath)) {
            res.status(404).json({ error: 'Balance CSV file not found' });
            return;
        }

        const rows = parseCSV(filePath);

        const accounts = [
            { key: 'pnc_a' as const, name: 'PNC Savings' },
            { key: 'pnc_b' as const, name: 'PNC Checking' },
            { key: 'fifth_third' as const, name: 'Fifth Third (EAC)' }
        ];

        const accountData = accounts.map(account => {
            const latest = getLatestValue(rows, account.key);
            const previous = getPreviousValue(rows, account.key, latest.date);
            const change = (latest.value !== null && previous !== null) ? latest.value - previous : null;
            const sparkline = getSparklineData(rows, account.key);

            return {
                name: account.name,
                balance: latest.value,
                date: latest.date,
                change,
                sparkline
            };
        });

        // Calculate total from latest individual values
        const totalBalance = accountData.reduce((sum, a) => sum + (a.balance || 0), 0);
        const totalSparkline = getSparklineData(rows, 'total');
        const latestTotal = getLatestValue(rows, 'total');
        const previousTotal = getPreviousValue(rows, 'total', latestTotal.date);
        const totalChange = (latestTotal.value !== null && previousTotal !== null) ? latestTotal.value - previousTotal : null;

        res.json({
            accounts: accountData,
            total: {
                balance: totalBalance,
                change: totalChange,
                sparkline: totalSparkline
            },
            lastUpdated: rows.length > 0 ? rows[rows.length - 1].date : null
        });
    } catch (error: any) {
        console.error('Finance data error:', error);
        res.status(500).json({ error: 'Failed to read finance data' });
    }
});
