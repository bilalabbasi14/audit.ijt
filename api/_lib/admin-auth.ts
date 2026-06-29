import type { VercelRequest } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { createLogger } from './logger.js';
import { getAnonKey, getMissingAdminEnvVars, getServiceClient, getSupabaseUrl } from './supabase-admin.js';

const log = createLogger('admin-auth');

type AuthSuccess = { userId: string };
type AuthFailure = { error: string; status: number };

export async function verifySuperAdmin(req: VercelRequest): Promise<AuthSuccess | AuthFailure> {
  const missingEnv = getMissingAdminEnvVars();
  if (missingEnv.length > 0) {
    log.error('admin API misconfigured', { missing: missingEnv });
    return {
      error: `Server misconfigured: set ${missingEnv.join(', ')} in Vercel project settings`,
      status: 503,
    };
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    log.warn('missing bearer token', { method: req.method, url: req.url });
    return { error: 'Unauthorized', status: 401 };
  }

  try {
    const token = authHeader.slice(7);
    const userClient = createClient(getSupabaseUrl(), getAnonKey(), {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: { user }, error } = await userClient.auth.getUser(token);
    if (error || !user) {
      log.warn('invalid token', { method: req.method, url: req.url });
      return { error: 'Unauthorized', status: 401 };
    }

    const service = getServiceClient();
    const { data: admin, error: adminError } = await service
      .from('super_admins')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (adminError) {
      log.error('super_admins lookup failed', { userId: user.id, message: adminError.message });
      return { error: 'Failed to verify admin access', status: 500 };
    }

    if (!admin) {
      log.warn('user is not super admin', { userId: user.id });
      return { error: 'Forbidden', status: 403 };
    }

    log.debug('verified super admin', { userId: user.id });
    return { userId: user.id };
  } catch (err) {
    log.error('verifySuperAdmin failed', { err });
    return { error: 'Internal server error', status: 500 };
  }
}
