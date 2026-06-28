import type { VercelRequest, VercelResponse } from '@vercel/node';
import { assertUserOrg } from '../../../../_lib/admin-org';
import { verifySuperAdmin } from '../../../../_lib/admin-auth';
import { createLogger } from '../../../../_lib/logger';
import { buildMonthlyMuawinReport } from '../../../../_lib/muawin-report';
import { getServiceClient } from '../../../../_lib/supabase-admin';

const log = createLogger('admin/users/[id]/muawineen/monthly-report');

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const started = Date.now();
  const userId = req.query.id as string;
  const month = String(req.query.month ?? '');

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  const auth = await verifySuperAdmin(req);
  if ('error' in auth) {
    return res.status(auth.status).json({ error: auth.error });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!MONTH_PATTERN.test(month)) {
    return res.status(400).json({ error: 'Valid month query (YYYY-MM) is required' });
  }

  try {
    const service = getServiceClient();
    const orgCheck = await assertUserOrg(service, userId);
    if (orgCheck.ok === false) {
      return res.status(orgCheck.status).json({ error: orgCheck.error });
    }

    const report = await buildMonthlyMuawinReport(service, userId, month);

    log.info('ok', {
      adminId: auth.userId,
      userId,
      month,
      rows: report.rows.length,
      ms: Date.now() - started,
    });

    return res.status(200).json(report);
  } catch (err) {
    log.error('failed', { userId, month, err: String(err) });
    return res.status(500).json({ error: 'Internal server error' });
  }
}
