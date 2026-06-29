import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifySuperAdmin } from '../_lib/admin-auth.js';
import { createLogger } from '../_lib/logger.js';
import { getPlatformStats } from '../_lib/user-stats.js';
import { getServiceClient } from '../_lib/supabase-admin.js';

const log = createLogger('admin/me');

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const started = Date.now();

  if (req.method !== 'GET') {
    log.warn('method not allowed', { method: req.method });
    return res.status(405).json({ error: 'Method not allowed' });
  }

  log.debug('request', { method: req.method, url: req.url });

  const auth = await verifySuperAdmin(req);
  if ('error' in auth) {
    log.info('auth failed', { status: auth.status, ms: Date.now() - started });
    return res.status(auth.status).json({ error: auth.error });
  }

  try {
    const service = getServiceClient();
    const stats = await getPlatformStats(service);

    log.info('ok', { userId: auth.userId, ms: Date.now() - started });
    return res.status(200).json({
      isSuperAdmin: true,
      userId: auth.userId,
      stats,
    });
  } catch (err) {
    log.error('failed', { userId: auth.userId, ms: Date.now() - started, err: String(err) });
    return res.status(500).json({ error: 'Internal server error' });
  }
}
