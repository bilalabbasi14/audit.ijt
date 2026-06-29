import { SupabaseClient } from '@supabase/supabase-js';

export async function deleteUserAndOrgData(
  service: SupabaseClient,
  userId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const tables = [
    'income_entries',
    'expense_entries',
    'monthly_summaries',
    'muawineen',
    'expense_categories',
  ] as const;

  for (const table of tables) {
    const { error } = await service.from(table).delete().eq('org_id', userId);
    if (error) {
      return { ok: false, error: `Failed to delete ${table}: ${error.message}` };
    }
  }

  const { error: orgError } = await service.from('organizations').delete().eq('id', userId);
  if (orgError) {
    return { ok: false, error: `Failed to delete organization: ${orgError.message}` };
  }

  const { error: adminError } = await service.from('super_admins').delete().eq('user_id', userId);
  if (adminError) {
    return { ok: false, error: `Failed to remove super admin record: ${adminError.message}` };
  }

  const { error: authError } = await service.auth.admin.deleteUser(userId);
  if (authError) {
    return { ok: false, error: authError.message };
  }

  return { ok: true };
}
