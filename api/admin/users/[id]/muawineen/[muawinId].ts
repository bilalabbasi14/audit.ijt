import type { VercelRequest, VercelResponse } from '@vercel/node';
import { assertUserOrg } from '../../../../_lib/admin-org';
import { verifySuperAdmin } from '../../../../_lib/admin-auth';
import { createLogger } from '../../../../_lib/logger';
import { getServiceClient } from '../../../../_lib/supabase-admin';

const log = createLogger('admin/users/[id]/muawineen/[muawinId]');

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const started = Date.now();
  const userId = req.query.id as string;
  const muawinId = req.query.muawinId as string;

  if (!userId || !muawinId) {
    return res.status(400).json({ error: 'User ID and muawin ID are required' });
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
    const orgCheck = await assertUserOrg(service, userId);
    if (orgCheck.ok === false) {
      return res.status(orgCheck.status).json({ error: orgCheck.error });
    }

    const { data: existing, error: findError } = await service
      .from('muawineen')
      .select('id')
      .eq('id', muawinId)
      .eq('org_id', userId)
      .maybeSingle();

    if (findError) {
      return res.status(500).json({ error: 'Failed to verify muawin' });
    }

    if (!existing) {
      return res.status(404).json({ error: 'Muawin not found' });
    }

    const { error } = await service.from('muawineen').delete().eq('id', muawinId).eq('org_id', userId);

    if (error) {
      log.error('delete failed', { userId, muawinId, message: error.message });
      return res.status(400).json({
        error: 'Could not delete muawin. Remove their income entries first.',
      });
    }

    log.info('deleted', { adminId: auth.userId, userId, muawinId, ms: Date.now() - started });
    return res.status(200).json({ success: true });
  } catch (err) {
    log.error('failed', { userId, muawinId, err: String(err) });
    return res.status(500).json({ error: 'Internal server error' });
  }
}
