import type { VercelRequest } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { getAnonKey, getServiceClient, getSupabaseUrl } from './supabase-admin';

type AuthSuccess = { userId: string };
type AuthFailure = { error: string; status: number };

export async function verifySuperAdmin(req: VercelRequest): Promise<AuthSuccess | AuthFailure> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: 'Unauthorized', status: 401 };
  }

  const token = authHeader.slice(7);
  const userClient = createClient(getSupabaseUrl(), getAnonKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: { user }, error } = await userClient.auth.getUser(token);
  if (error || !user) {
    return { error: 'Unauthorized', status: 401 };
  }

  const service = getServiceClient();
  const { data: admin } = await service
    .from('super_admins')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!admin) {
    return { error: 'Forbidden', status: 403 };
  }

  return { userId: user.id };
}
