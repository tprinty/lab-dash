import axios from 'axios';
import { Request, Response, Router } from 'express';

import { authenticateToken } from '../middleware/auth.middleware';
import { getItemConnectionInfo } from '../utils/config-lookup';
import { decrypt, isEncrypted } from '../utils/crypto';

export const sprintRoute = Router();

const GITHUB_API_URL = 'https://api.github.com';

// Cache for sprint data (5 minutes)
const cache: Map<string, { data: any; timestamp: number }> = new Map();
const CACHE_TTL = 5 * 60 * 1000;

interface RepoSprint {
    name: string;
    fullName: string;
    url: string;
    openIssues: number;
    closedIssues: number;
    totalIssues: number;
    progressPercent: number;
    lastCommit: {
        message: string;
        date: string;
        author: string;
    } | null;
    topIssue: {
        title: string;
        number: number;
        url: string;
    } | null;
    ciStatus: 'passing' | 'failing' | 'pending' | 'none';
    ciUrl: string | null;
}

function getCachedData(key: string): any | null {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
    }
    return null;
}

function setCacheData(key: string, data: any): void {
    cache.set(key, { data, timestamp: Date.now() });
}

const getSprintToken = (itemId: string): string | null => {
    try {
        const connectionInfo = getItemConnectionInfo(itemId);
        let token = connectionInfo.token;
        if (!token) return null;
        if (isEncrypted(token)) {
            token = decrypt(token);
            if (!token) return null;
        }
        return token;
    } catch (error) {
        console.error('Error getting sprint token:', error);
        return null;
    }
};

const getSprintRepos = (itemId: string): string[] => {
    try {
        const connectionInfo = getItemConnectionInfo(itemId);
        const repos = connectionInfo.repos || 'tprinty/tangopapa,tprinty/wpsentinelai,tprinty/developer-metrics-dashboard';
        return repos.split(',').map((r: string) => r.trim()).filter(Boolean);
    } catch (error) {
        return ['tprinty/tangopapa', 'tprinty/wpsentinelai', 'tprinty/developer-metrics-dashboard'];
    }
};

async function fetchRepoSprint(owner: string, repo: string, token: string): Promise<RepoSprint> {
    const headers = {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json'
    };

    const result: RepoSprint = {
        name: repo,
        fullName: `${owner}/${repo}`,
        url: `https://github.com/${owner}/${repo}`,
        openIssues: 0,
        closedIssues: 0,
        totalIssues: 0,
        progressPercent: 0,
        lastCommit: null,
        topIssue: null,
        ciStatus: 'none',
        ciUrl: null
    };

    try {
        // Fetch open and closed issue counts, latest commit, top issue, and CI in parallel
        const [openRes, closedRes, commitsRes, issuesRes, actionsRes] = await Promise.all([
            axios.get(`${GITHUB_API_URL}/repos/${owner}/${repo}/issues?state=open&per_page=1`, { headers }).catch(() => null),
            axios.get(`${GITHUB_API_URL}/repos/${owner}/${repo}/issues?state=closed&per_page=1`, { headers }).catch(() => null),
            axios.get(`${GITHUB_API_URL}/repos/${owner}/${repo}/commits?per_page=1`, { headers }).catch(() => null),
            axios.get(`${GITHUB_API_URL}/repos/${owner}/${repo}/issues?state=open&sort=created&direction=asc&per_page=1`, { headers }).catch(() => null),
            axios.get(`${GITHUB_API_URL}/repos/${owner}/${repo}/actions/runs?per_page=1`, { headers }).catch(() => null),
        ]);

        // Parse issue counts from Link header (GitHub pagination)
        if (openRes) {
            const linkHeader = openRes.headers['link'] || '';
            const lastPageMatch = linkHeader.match(/page=(\d+)>; rel="last"/);
            result.openIssues = lastPageMatch ? parseInt(lastPageMatch[1]) : (openRes.data.length || 0);
        }

        if (closedRes) {
            const linkHeader = closedRes.headers['link'] || '';
            const lastPageMatch = linkHeader.match(/page=(\d+)>; rel="last"/);
            result.closedIssues = lastPageMatch ? parseInt(lastPageMatch[1]) : (closedRes.data.length || 0);
        }

        result.totalIssues = result.openIssues + result.closedIssues;
        result.progressPercent = result.totalIssues > 0 ? Math.round((result.closedIssues / result.totalIssues) * 100) : 0;

        // Latest commit
        if (commitsRes?.data?.[0]) {
            const c = commitsRes.data[0];
            result.lastCommit = {
                message: (c.commit?.message || '').split('\n')[0],
                date: c.commit?.author?.date || c.commit?.committer?.date || '',
                author: c.commit?.author?.name || 'Unknown'
            };
        }

        // Top priority issue
        if (issuesRes?.data?.[0]) {
            const i = issuesRes.data[0];
            result.topIssue = {
                title: i.title,
                number: i.number,
                url: i.html_url
            };
        }

        // CI status
        if (actionsRes?.data?.workflow_runs?.[0]) {
            const run = actionsRes.data.workflow_runs[0];
            if (run.conclusion === 'success') result.ciStatus = 'passing';
            else if (run.conclusion === 'failure' || run.conclusion === 'cancelled') result.ciStatus = 'failing';
            else if (run.status === 'in_progress' || run.status === 'queued') result.ciStatus = 'pending';
            result.ciUrl = run.html_url;
        }
    } catch (error: any) {
        console.error(`Error fetching sprint data for ${owner}/${repo}:`, error.message);
    }

    return result;
}

// POST /data - Get sprint tracker data
sprintRoute.post('/data', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    const { itemId } = req.body;

    if (!itemId) {
        res.status(400).json({ error: 'Item ID is required' });
        return;
    }

    try {
        const token = getSprintToken(itemId);
        if (!token) {
            res.status(400).json({ error: 'GitHub token is required' });
            return;
        }

        // Check cache
        const cacheKey = `sprint_${itemId}`;
        const cachedData = getCachedData(cacheKey);
        if (cachedData) {
            res.json(cachedData);
            return;
        }

        const repos = getSprintRepos(itemId);

        // Fetch all repos in parallel
        const repoData = await Promise.all(
            repos.map(fullName => {
                const [owner, repo] = fullName.split('/');
                return fetchRepoSprint(owner, repo, token);
            })
        );

        const result = {
            repos: repoData,
            lastUpdated: new Date().toLocaleString('en-US', {
                timeZone: 'America/Chicago',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
            })
        };

        setCacheData(cacheKey, result);
        res.json(result);
    } catch (error: any) {
        console.error('Error fetching sprint data:', error.message);
        if (error.response?.status === 401) {
            res.status(401).json({ error: 'Invalid or expired GitHub token' });
        } else {
            res.status(500).json({ error: 'Failed to fetch sprint data' });
        }
    }
});
