import { Request, Response, Router } from 'express';
import { execFile } from 'child_process';
import { authenticateToken } from '../middleware/auth.middleware';
import { decrypt } from '../utils/crypto';

export const cameraRoute = Router();

// POST /snapshot - Get a JPEG snapshot from an RTSP camera
cameraRoute.post('/snapshot', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const { host, port, username, password, channel, subtype } = req.body;

        if (!host || !channel) {
            res.status(400).json({ error: 'host and channel are required' });
            return;
        }

        const actualPort = port || '554';
        const actualUsername = username || 'admin';
        const actualSubtype = subtype || '1';

        // Decrypt password if encrypted
        let actualPassword = password || '';
        try {
            actualPassword = decrypt(actualPassword);
        } catch (e) {
            // Use as-is if decryption fails
        }

        const rtspUrl = `rtsp://${actualUsername}:${actualPassword}@${host}:${actualPort}/cam/realmonitor?channel=${channel}&subtype=${actualSubtype}`;

        // Use ffmpeg to grab a single frame
        const args = [
            '-rtsp_transport', 'tcp',
            '-i', rtspUrl,
            '-frames:v', '1',
            '-f', 'image2',
            '-vcodec', 'mjpeg',
            '-q:v', '5',
            'pipe:1'
        ];

        const child = execFile('ffmpeg', args, {
            encoding: 'buffer' as any,
            timeout: 8000,
            maxBuffer: 5 * 1024 * 1024
        }, (error: any, stdout: any, stderr: any) => {
            if (error) {
                console.error('ffmpeg error:', error.message);
                res.status(500).json({ error: 'Failed to capture snapshot' });
                return;
            }
            if (!stdout || (stdout as Buffer).length === 0) {
                res.status(500).json({ error: 'Empty snapshot' });
                return;
            }
            res.set('Content-Type', 'image/jpeg');
            res.set('Cache-Control', 'no-cache, no-store');
            res.send(stdout);
        });
    } catch (error: any) {
        console.error('Camera snapshot error:', error);
        res.status(500).json({ error: 'Failed to capture snapshot' });
    }
});

// POST /test - Test camera connection
cameraRoute.post('/test', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const { host, port, username, password, channel, subtype } = req.body;

        if (!host) {
            res.status(400).json({ error: 'host is required' });
            return;
        }

        const actualPort = port || '554';
        const actualUsername = username || 'admin';
        const actualSubtype = subtype || '1';
        const actualChannel = channel || '1';

        let actualPassword = password || '';
        try {
            actualPassword = decrypt(actualPassword);
        } catch (e) {}

        const rtspUrl = `rtsp://${actualUsername}:${actualPassword}@${host}:${actualPort}/cam/realmonitor?channel=${actualChannel}&subtype=${actualSubtype}`;

        const args = [
            '-rtsp_transport', 'tcp',
            '-i', rtspUrl,
            '-frames:v', '1',
            '-f', 'null',
            '-'
        ];

        execFile('ffmpeg', args, { timeout: 10000 }, (error: any) => {
            if (error) {
                res.json({ success: false, error: error.message });
                return;
            }
            res.json({ success: true });
        });
    } catch (error: any) {
        res.status(500).json({ error: 'Connection test failed' });
    }
});
