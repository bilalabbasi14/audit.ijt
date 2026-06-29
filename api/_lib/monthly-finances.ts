import { SupabaseClient } from '@supabase/supabase-js';

export type MonthlyFinancesReport = {
  month: string;
  summary: {
    totalIncome: number;
    totalExpenses: number;
    closingBalance: number | null;
    lastMonthBalance: number | null;
    isDeficit: boolean;
  } | null;
  income: Array<{
    id: string;
    date: string;
    amount: number;
    type: string;
    muawinName: string;
    notes: string | null;
    khasoosiPurpose: string | null;
  }>;
  expenses: Array<{
    id: string;
    date: string;
    amount: number;
    categoryName: string;
    description: string | null;
  }>;
};

export async function buildMonthlyFinancesReport(
  service: SupabaseClient,
  orgId: string,
  month: string,
): Promise<MonthlyFinancesReport> {
  const [incomeRes, expenseRes, summaryRes, muawinRes, categoryRes] = await Promise.all([
    service
      .from('income_entries')
      .select('*')
      .eq('org_id', orgId)
      .eq('month', month)
      .order('date', { ascending: false }),
    service
      .from('expense_entries')
      .select('*')
      .eq('org_id', orgId)
      .eq('month', month)
      .order('date', { ascending: false }),
    service
      .from('monthly_summaries')
      .select('*')
      .eq('org_id', orgId)
      .eq('month', month)
      .maybeSingle(),
    service.from('muawineen').select('id, name').eq('org_id', orgId),
    service.from('expense_categories').select('id, name').eq('org_id', orgId),
  ]);

  const muawinMap = new Map((muawinRes.data ?? []).map((m) => [m.id, m.name]));
  const categoryMap = new Map((categoryRes.data ?? []).map((c) => [c.id, c.name]));

  const incomes = incomeRes.data ?? [];
  const expenses = expenseRes.data ?? [];
  const summaryRow = summaryRes.data;

  return {
    month,
    summary: summaryRow
      ? {
          totalIncome: Number(summaryRow.total_income),
          totalExpenses: Number(summaryRow.total_expenses),
          closingBalance: Number(summaryRow.closing_balance),
          lastMonthBalance: Number(summaryRow.last_month_balance),
          isDeficit: Boolean(summaryRow.is_deficit),
        }
      : {
          totalIncome: incomes.reduce((sum, i) => sum + Number(i.amount), 0),
          totalExpenses: expenses.reduce((sum, e) => sum + Number(e.amount), 0),
          closingBalance: null,
          lastMonthBalance: null,
          isDeficit: false,
        },
    income: incomes.map((entry) => ({
      id: entry.id,
      date: entry.date,
      amount: Number(entry.amount),
      type: entry.type,
      muawinName: muawinMap.get(entry.muawin_id) ?? 'Unknown',
      notes: entry.notes,
      khasoosiPurpose: entry.khasoosi_purpose,
    })),
    expenses: expenses.map((entry) => ({
      id: entry.id,
      date: entry.date,
      amount: Number(entry.amount),
      categoryName: categoryMap.get(entry.category_id) ?? 'Unknown',
      description: entry.description,
    })),
  };
}
