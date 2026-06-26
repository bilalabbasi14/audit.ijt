import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifySuperAdmin } from '../_lib/admin-auth';
import { getPlatformStats } from '../_lib/user-stats';
import { getServiceClient } from '../_lib/supabase-admin';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = await verifySuperAdmin(req);
  if ('error' in auth) {
    return res.status(auth.status).json({ error: auth.error });
  }

  try {
    const service = getServiceClient();
    const stats = await getPlatformStats(service);

    return res.status(200).json({
      isSuperAdmin: true,
      userId: auth.userId,
      stats,
    });
  } catch (err) {
    console.error('Admin me error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
