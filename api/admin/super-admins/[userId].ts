import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifySuperAdmin } from '../../_lib/admin-auth.js';
import { createLogger } from '../../_lib/logger.js';
import { getServiceClient } from '../../_lib/supabase-admin.js';

const log = createLogger('admin/super-admins/[userId]');

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const started = Date.now();
  const targetUserId = req.query.userId as string;

  if (!targetUserId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  const auth = await verifySuperAdmin(req);
  if ('error' in auth) {
    return res.status(auth.status).json({ error: auth.error });
  }

  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const service = getServiceClient();

    const { data: admins, error: listError } = await service
      .from('super_admins')
      .select('user_id');

    if (listError) {
      return res.status(500).json({ error: 'Failed to verify admin count' });
    }

    const adminIds = (admins ?? []).map((a) => a.user_id);

    if (!adminIds.includes(targetUserId)) {
      return res.status(404).json({ error: 'Super admin not found' });
    }

    if (adminIds.length <= 1) {
      return res.status(400).json({ error: 'Cannot remove the last super admin' });
    }

    if (targetUserId === auth.userId) {
      return res.status(400).json({
        error: 'Cannot remove your own admin access. Ask another admin to remove you.',
      });
    }

    const { error } = await service.from('super_admins').delete().eq('user_id', targetUserId);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    log.info('removed', { adminId: auth.userId, targetUserId, ms: Date.now() - started });
    return res.status(200).json({ success: true });
  } catch (err) {
    log.error('failed', { targetUserId, err: String(err) });
    return res.status(500).json({ error: 'Internal server error' });
  }
}
