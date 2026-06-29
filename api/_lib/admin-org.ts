import { SupabaseClient } from '@supabase/supabase-js';

export async function assertUserOrg(
  service: SupabaseClient,
  userId: string,
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const { data: authData, error: authError } = await service.auth.admin.getUserById(userId);
  if (authError || !authData.user) {
    return { ok: false, status: 404, error: 'User not found' };
  }

  const { data: org, error: orgError } = await service
    .from('organizations')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  if (orgError) {
    return { ok: false, status: 500, error: 'Failed to load organization' };
  }

  if (!org) {
    return { ok: false, status: 404, error: 'Organization not found for this user' };
  }

  return { ok: true };
}
