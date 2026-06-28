import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifySuperAdmin } from '../../_lib/admin-auth';
import { emailToUsername } from '../../_lib/auth-utils';
import { createLogger } from '../../_lib/logger';
import { getOrgStats } from '../../_lib/user-stats';
import { getServiceClient } from '../../_lib/supabase-admin';

const log = createLogger('admin/users/[id]');

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

  const userId = req.query.id as string;
  if (!userId) {
    log.warn('missing user id', { adminId: auth.userId });
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    const service = getServiceClient();
    log.debug('get user', { adminId: auth.userId, userId });

    const { data: authData, error: authError } = await service.auth.admin.getUserById(userId);
    if (authError || !authData.user) {
      log.info('user not found', { adminId: auth.userId, userId, ms: Date.now() - started });
      return res.status(404).json({ error: 'User not found' });
    }

    const user = authData.user;

    const [orgRes, stats, summariesRes, incomeRes, expenseRes] = await Promise.all([
      service.from('organizations').select('*').eq('id', userId).maybeSingle(),
      getOrgStats(service, userId),
      service
        .from('monthly_summaries')
        .select('*')
        .eq('org_id', userId)
        .order('month', { ascending: false })
        .limit(12),
      service
        .from('income_entries')
        .select('*')
        .eq('org_id', userId)
        .order('created_at', { ascending: false })
        .limit(10),
      service
        .from('expense_entries')
        .select('*')
        .eq('org_id', userId)
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    const org = orgRes.data;

    log.info('ok', {
      adminId: auth.userId,
      userId,
      hasOrg: Boolean(org),
      ms: Date.now() - started,
    });

    return res.status(200).json({
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
      monthlySummaries: summariesRes.data ?? [],
      recentIncome: incomeRes.data ?? [],
      recentExpenses: expenseRes.data ?? [],
    });
  } catch (err) {
    log.error('failed', { adminId: auth.userId, userId, ms: Date.now() - started, err: String(err) });
    return res.status(500).json({ error: 'Internal server error' });
  }
}
