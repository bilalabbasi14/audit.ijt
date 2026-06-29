import type { VercelRequest, VercelResponse } from '@vercel/node';
import { assertUserOrg } from '../../../_lib/admin-org.js';
import { verifySuperAdmin } from '../../../_lib/admin-auth.js';
import { createLogger } from '../../../_lib/logger.js';
import { getServiceClient } from '../../../_lib/supabase-admin.js';

const log = createLogger('admin/users/[id]/muawineen');

type CreateMuawinBody = {
  name?: string;
  category?: 'amoomi' | 'khasoosi' | 'both';
  amoomi_committed_amount?: number;
  contact_number?: string | null;
  address?: string | null;
  detail?: string | null;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const started = Date.now();
  const userId = req.query.id as string;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  const auth = await verifySuperAdmin(req);
  if ('error' in auth) {
    return res.status(auth.status).json({ error: auth.error });
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const service = getServiceClient();
    const orgCheck = await assertUserOrg(service, userId);
    if (orgCheck.ok === false) {
      return res.status(orgCheck.status).json({ error: orgCheck.error });
    }

    if (req.method === 'GET') {
      const { data, error } = await service
        .from('muawineen')
        .select('*')
        .eq('org_id', userId)
        .order('name');

      if (error) {
        log.error('list failed', { userId, message: error.message });
        return res.status(500).json({ error: 'Failed to load muawineen' });
      }

      log.info('list ok', {
        adminId: auth.userId,
        userId,
        count: data?.length ?? 0,
        ms: Date.now() - started,
      });
      return res.status(200).json({ muawineen: data ?? [] });
    }

    const body = req.body as CreateMuawinBody;
    const name = body.name?.trim();
    const category = body.category;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    if (!category || !['amoomi', 'khasoosi', 'both'].includes(category)) {
      return res.status(400).json({ error: 'Valid category is required' });
    }

    const committed =
      category !== 'khasoosi' ? Number(body.amoomi_committed_amount ?? 0) : 0;

    const { data, error } = await service
      .from('muawineen')
      .insert({
        org_id: userId,
        name,
        category,
        amoomi_committed_amount: committed,
        contact_number: body.contact_number?.trim() || null,
        address: body.address?.trim() || null,
        detail: body.detail?.trim() || null,
      })
      .select('*')
      .single();

    if (error) {
      log.error('create failed', { userId, message: error.message });
      return res.status(400).json({ error: error.message });
    }

    log.info('created', {
      adminId: auth.userId,
      userId,
      muawinId: data.id,
      ms: Date.now() - started,
    });
    return res.status(201).json({ muawin: data });
  } catch (err) {
    log.error('failed', { userId, err: String(err) });
    return res.status(500).json({ error: 'Internal server error' });
  }
}
