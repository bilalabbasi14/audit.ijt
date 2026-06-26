import { SupabaseClient } from '@supabase/supabase-js';

export type OrgStats = {
  muawineenCount: number;
  totalIncome: number;
  totalExpenses: number;
  latestClosingBalance: number | null;
};

export async function getOrgStats(service: SupabaseClient, orgId: string): Promise<OrgStats> {
  const [muawineenRes, incomeRes, expenseRes, summaryRes] = await Promise.all([
    service.from('muawineen').select('id', { count: 'exact', head: true }).eq('org_id', orgId),
    service.from('income_entries').select('amount').eq('org_id', orgId),
    service.from('expense_entries').select('amount').eq('org_id', orgId),
    service
      .from('monthly_summaries')
      .select('closing_balance')
      .eq('org_id', orgId)
      .order('month', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const totalIncome = (incomeRes.data ?? []).reduce((sum, row) => sum + Number(row.amount), 0);
  const totalExpenses = (expenseRes.data ?? []).reduce((sum, row) => sum + Number(row.amount), 0);

  return {
    muawineenCount: muawineenRes.count ?? 0,
    totalIncome,
    totalExpenses,
    latestClosingBalance: summaryRes.data?.closing_balance ?? null,
  };
}

export async function getPlatformStats(service: SupabaseClient) {
  const [orgsRes, incomeRes, expenseRes, muawineenRes] = await Promise.all([
    service.from('organizations').select('id', { count: 'exact', head: true }),
    service.from('income_entries').select('amount'),
    service.from('expense_entries').select('amount'),
    service.from('muawineen').select('id', { count: 'exact', head: true }),
  ]);

  const totalIncome = (incomeRes.data ?? []).reduce((sum, row) => sum + Number(row.amount), 0);
  const totalExpenses = (expenseRes.data ?? []).reduce((sum, row) => sum + Number(row.amount), 0);

  return {
    totalOrganizations: orgsRes.count ?? 0,
    totalMuawineen: muawineenRes.count ?? 0,
    totalIncome,
    totalExpenses,
  };
}
