import { Request, Response, Router } from 'express';
import { execFile } from 'child_process';
import { authenticateToken } from '../middleware/auth.middleware';
import { decrypt } from '../utils/crypto';
import { findItemById, getConnectionInfo } from '../utils/config-lookup';

export const cameraRoute = Router();

/**
 * Resolve camera credentials - either from request body or from server-side config
 */
function resolveCameraConfig(body: any) {
    let { host, port, username, password, channel, subtype, itemId } = body;

    // If itemId is provided, look up credentials from server-side config
    if (itemId) {
        const item = findItemById(itemId);
        if (item?.config) {
            const connInfo = getConnectionInfo(item);
            host = host || connInfo.host;
            port = port || connInfo.port;
            username = username || connInfo.username;
            password = connInfo.password || ''; // Already decrypted by getConnectionInfo
            subtype = subtype || connInfo.subtype;
        }
    }

    // Decrypt password if still encrypted (from direct body params)
    let actualPassword = password || '';
    if (actualPassword.startsWith('ENC:')) {
        try {
            actualPassword = decrypt(actualPassword);
        } catch (e) {
            // Use as-is if decryption fails
        }
    }

    return {
        host: host || '192.168.2.10',
        port: port || '554',
        username: username || 'admin',
        password: actualPassword,
        channel: channel || '1',
        subtype: subtype || '1'
    };
}

// POST /snapshot - Get a JPEG snapshot from an RTSP camera
cameraRoute.post('/snapshot', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const config = resolveCameraConfig(req.body);

        if (!config.host || !req.body.channel) {
            res.status(400).json({ error: 'host and channel are required' });
            return;
        }

        const rtspUrl = `rtsp://${config.username}:${config.password}@${config.host}:${config.port}/cam/realmonitor?channel=${req.body.channel}&subtype=${config.subtype}`;

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

        execFile('ffmpeg', args, {
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
        const config = resolveCameraConfig(req.body);

        if (!config.host) {
            res.status(400).json({ error: 'host is required' });
            return;
        }

        const rtspUrl = `rtsp://${config.username}:${config.password}@${config.host}:${config.port}/cam/realmonitor?channel=${config.channel}&subtype=${config.subtype}`;

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
