import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifySuperAdmin } from '../../../_lib/admin-auth';
import { getServiceClient } from '../../../_lib/supabase-admin';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = await verifySuperAdmin(req);
  if ('error' in auth) {
    return res.status(auth.status).json({ error: auth.error });
  }

  const userId = req.query.id as string;
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  const { password } = req.body as { password?: string };
  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    const service = getServiceClient();
    const { error } = await service.auth.admin.updateUserById(userId, { password });

    if (error) {
      console.error('Reset password error:', error);
      return res.status(400).json({ error: error.message });
    }

    console.info(`Admin ${auth.userId} reset password for user ${userId}`);

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Admin reset password error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
