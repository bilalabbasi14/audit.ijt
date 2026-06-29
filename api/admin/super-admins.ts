import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { User } from '@supabase/supabase-js';
import { verifySuperAdmin } from '../_lib/admin-auth';
import { emailToUsername } from '../_lib/auth-utils';
import { createLogger } from '../_lib/logger';
import { getServiceClient } from '../_lib/supabase-admin';

const log = createLogger('admin/super-admins');

type AddAdminBody = {
  userId?: string;
  email?: string;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const started = Date.now();

  const auth = await verifySuperAdmin(req);
  if ('error' in auth) {
    return res.status(auth.status).json({ error: auth.error });
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const service = getServiceClient();

    if (req.method === 'GET') {
      const { data: adminRows, error } = await service
        .from('super_admins')
        .select('user_id, created_at')
        .order('created_at', { ascending: true });

      if (error) {
        return res.status(500).json({ error: 'Failed to load super admins' });
      }

      const admins = await Promise.all(
        (adminRows ?? []).map(async (row) => {
          const { data: userData } = await service.auth.admin.getUserById(row.user_id);
          const user = userData.user;
          return {
            userId: row.user_id,
            email: user?.email ?? '',
            username: emailToUsername(user?.email ?? ''),
            createdAt: row.created_at,
            isSelf: row.user_id === auth.userId,
          };
        }),
      );

      log.info('list ok', { adminId: auth.userId, count: admins.length, ms: Date.now() - started });
      return res.status(200).json({ admins });
    }

    const body = req.body as AddAdminBody;
    let targetUserId = body.userId?.trim();

    if (!targetUserId && body.email?.trim()) {
      const email = body.email.trim().toLowerCase();
      const { data: authData, error: listError } = await service.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });

      if (listError) {
        return res.status(500).json({ error: 'Failed to search users' });
      }

      const users = authData.users as User[];
      const match = users.find((u) => (u.email ?? '').toLowerCase() === email);
      if (!match) {
        return res.status(404).json({ error: 'No user found with that email' });
      }
      targetUserId = match.id;
    }

    if (!targetUserId) {
      return res.status(400).json({ error: 'userId or email is required' });
    }

    const { data: targetUser, error: userError } = await service.auth.admin.getUserById(targetUserId);
    if (userError || !targetUser.user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { data: existing } = await service
      .from('super_admins')
      .select('user_id')
      .eq('user_id', targetUserId)
      .maybeSingle();

    if (existing) {
      return res.status(409).json({ error: 'User is already a super admin' });
    }

    const { error: insertError } = await service
      .from('super_admins')
      .insert({ user_id: targetUserId });

    if (insertError) {
      return res.status(400).json({ error: insertError.message });
    }

    log.info('added', { adminId: auth.userId, targetUserId, ms: Date.now() - started });
    return res.status(201).json({
      admin: {
        userId: targetUserId,
        email: targetUser.user.email ?? '',
        username: emailToUsername(targetUser.user.email ?? ''),
      },
    });
  } catch (err) {
    log.error('failed', { err: String(err) });
    return res.status(500).json({ error: 'Internal server error' });
  }
}
