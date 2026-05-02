import { supabase } from '@/lib/supabase';
import { getPreviousMonth } from './session';

export async function recalculateMonthlySummary(orgId: string, month: string) {
  // 1. Fetch all income for the month
  const { data: incomes } = await supabase
    .from('income_entries')
    .select('*')
    .eq('org_id', orgId)
    .eq('month', month);

  // 2. Fetch all expenses for the month
  const { data: expenses } = await supabase
    .from('expense_entries')
    .select('*')
    .eq('org_id', orgId)
    .eq('month', month);

  // 3. Fetch all amoomi committed amounts
  const { data: muawineen } = await supabase
    .from('muawineen')
    .select('amoomi_committed_amount')
    .eq('org_id', orgId)
    .in('category', ['amoomi', 'both']);

  const totalIncome = incomes?.reduce((sum, i) => sum + Number(i.amount), 0) || 0;
  const totalAmoomiIncome = incomes?.filter(i => i.type === 'amoomi').reduce((sum, i) => sum + Number(i.amount), 0) || 0;
  const totalKhasoosiIncome = incomes?.filter(i => i.type === 'khasoosi').reduce((sum, i) => sum + Number(i.amount), 0) || 0;
  const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
  const totalExpectedAmoomi = muawineen?.reduce((sum, m) => sum + Number(m.amoomi_committed_amount || 0), 0) || 0;

  // 4. Fetch last month's balance
  const prevMonth = getPreviousMonth(month);
  const { data: prevSummary } = await supabase
    .from('monthly_summaries')
    .select('closing_balance, is_deficit')
    .eq('org_id', orgId)
    .eq('month', prevMonth)
    .single();

  const lastMonthBalance = (prevSummary && !prevSummary.is_deficit) ? Number(prevSummary.closing_balance) : 0;

  // 5. Calculate closing balance
  const closingBalance = lastMonthBalance + totalIncome - totalExpenses;
  const isDeficit = closingBalance < 0;

  // 6. Upsert
  const { error } = await supabase
    .from('monthly_summaries')
    .upsert({
      org_id: orgId,
      month,
      total_income: totalIncome,
      total_amoomi_income: totalAmoomiIncome,
      total_khasoosi_income: totalKhasoosiIncome,
      total_expected_amoomi: totalExpectedAmoomi,
      total_expenses: totalExpenses,
      last_month_balance: lastMonthBalance,
      closing_balance: closingBalance,
      is_deficit: isDeficit,
      updated_at: new Date().toISOString()
    }, { onConflict: 'org_id, month' });

  if (error) console.error('Error updating monthly summary:', error);
}
