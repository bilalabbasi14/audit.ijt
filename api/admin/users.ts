import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifySuperAdmin } from '../_lib/admin-auth';
import { emailToUsername } from '../_lib/auth-utils';
import { createLogger } from '../_lib/logger';
import { getOrgStats } from '../_lib/user-stats';
import { getServiceClient } from '../_lib/supabase-admin';

const log = createLogger('admin/users');

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const started = Date.now();

  if (req.method !== 'GET') {
    log.warn('method not allowed', { method: req.method });
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = await verifySuperAdmin(req);
  if ('error' in auth) {
    log.info('auth failed', { status: auth.status, ms: Date.now() - started });
    return res.status(auth.status).json({ error: auth.error });
  }

  try {
    const service = getServiceClient();
    const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1);
    const perPage = Math.min(100, Math.max(1, parseInt(String(req.query.perPage ?? '50'), 10) || 50));

    log.debug('list users', { adminId: auth.userId, page, perPage });

    const { data: authData, error: authError } = await service.auth.admin.listUsers({
      page,
      perPage,
    });

    if (authError) {
      log.error('listUsers failed', { adminId: auth.userId, err: authError.message });
      return res.status(500).json({ error: 'Failed to list users' });
    }

    const users = authData.users;
    const userIds = users.map((u) => u.id);

    const { data: orgs } = await service
      .from('organizations')
      .select('*')
      .in('id', userIds);

    const orgMap = new Map((orgs ?? []).map((org) => [org.id, org]));

    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const org = orgMap.get(user.id);
        const stats = org ? await getOrgStats(service, user.id) : null;

        return {
          id: user.id,
          email: user.email ?? '',
          username: emailToUsername(user.email ?? ''),
          createdAt: user.created_at,
          lastSignInAt: user.last_sign_in_at ?? null,
          organization: org
            ? {
                id: org.id,
                name: org.name,
                currencySymbol: org.currency_symbol,
                createdAt: org.created_at,
              }
            : null,
          stats,
        };
      })
    );

    const total = 'total' in authData ? (authData.total ?? users.length) : users.length;
    log.info('ok', { adminId: auth.userId, page, perPage, count: users.length, total, ms: Date.now() - started });

    return res.status(200).json({
      users: usersWithStats,
      page,
      perPage,
      total,
    });
  } catch (err) {
    log.error('failed', { adminId: auth.userId, ms: Date.now() - started, err: String(err) });
    return res.status(500).json({ error: 'Internal server error' });
  }
}
