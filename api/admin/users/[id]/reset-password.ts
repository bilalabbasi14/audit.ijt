import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifySuperAdmin } from '../../../_lib/admin-auth';
import { createLogger } from '../../../_lib/logger';
import { getServiceClient } from '../../../_lib/supabase-admin';

const log = createLogger('admin/users/reset-password');

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const started = Date.now();

  if (req.method !== 'POST') {
    log.warn('method not allowed', { method: req.method });
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = await verifySuperAdmin(req);
  if ('error' in auth) {
    log.info('auth failed', { status: auth.status, ms: Date.now() - started });
    return res.status(auth.status).json({ error: auth.error });
  }

  const userId = req.query.id as string;
  if (!userId) {
    log.warn('missing user id', { adminId: auth.userId });
    return res.status(400).json({ error: 'User ID is required' });
  }

  const { password } = req.body as { password?: string };
  if (!password || password.length < 6) {
    log.warn('invalid password', { adminId: auth.userId, userId });
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    const service = getServiceClient();
    const { error } = await service.auth.admin.updateUserById(userId, { password });

    if (error) {
      log.error('updateUserById failed', { adminId: auth.userId, userId, err: error.message });
      return res.status(400).json({ error: error.message });
    }

    log.info('password reset', { adminId: auth.userId, userId, ms: Date.now() - started });
    return res.status(200).json({ success: true });
  } catch (err) {
    log.error('failed', { adminId: auth.userId, userId, ms: Date.now() - started, err: String(err) });
    return res.status(500).json({ error: 'Internal server error' });
  }
}
