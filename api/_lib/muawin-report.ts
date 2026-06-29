import { SupabaseClient } from '@supabase/supabase-js';

export type MuawinPaymentStatus = 'paid' | 'partial' | 'unpaid' | 'not_applicable';

export type MonthlyMuawinRow = {
  muawinId: string;
  name: string;
  category: 'amoomi' | 'khasoosi' | 'both';
  committedAmount: number;
  amoomiPaid: number;
  khasoosiPaid: number;
  totalPaid: number;
  amoomiStatus: MuawinPaymentStatus;
  hasIncome: boolean;
};

export type MonthlyMuawinReport = {
  month: string;
  rows: MonthlyMuawinRow[];
  summary: {
    totalMuawineen: number;
    paidCount: number;
    partialCount: number;
    unpaidCount: number;
    expectedAmoomi: number;
    receivedAmoomi: number;
  };
};

export function computeAmoomiStatus(
  paid: number,
  committed: number,
  category: 'amoomi' | 'khasoosi' | 'both',
): MuawinPaymentStatus {
  if (category === 'khasoosi') return 'not_applicable';
  if (paid <= 0) return 'unpaid';
  if (committed <= 0) return 'paid';
  if (paid >= committed) return 'paid';
  return 'partial';
}

export async function buildMonthlyMuawinReport(
  service: SupabaseClient,
  orgId: string,
  month: string,
): Promise<MonthlyMuawinReport> {
  const [muawineenRes, incomeRes] = await Promise.all([
    service.from('muawineen').select('*').eq('org_id', orgId).order('name'),
    service.from('income_entries').select('*').eq('org_id', orgId).eq('month', month),
  ]);

  const muawineen = muawineenRes.data ?? [];
  const incomes = incomeRes.data ?? [];

  let paidCount = 0;
  let partialCount = 0;
  let unpaidCount = 0;
  let expectedAmoomi = 0;
  let receivedAmoomi = 0;

  const rows: MonthlyMuawinRow[] = muawineen.map((muawin) => {
    const muawinIncomes = incomes.filter((i) => i.muawin_id === muawin.id);
    const amoomiPaid = muawinIncomes
      .filter((i) => i.type === 'amoomi')
      .reduce((sum, i) => sum + Number(i.amount), 0);
    const khasoosiPaid = muawinIncomes
      .filter((i) => i.type === 'khasoosi')
      .reduce((sum, i) => sum + Number(i.amount), 0);
    const totalPaid = amoomiPaid + khasoosiPaid;
    const committed = Number(muawin.amoomi_committed_amount ?? 0);
    const category = muawin.category as 'amoomi' | 'khasoosi' | 'both';
    const amoomiStatus = computeAmoomiStatus(amoomiPaid, committed, category);

    if (category !== 'khasoosi') {
      expectedAmoomi += committed;
      receivedAmoomi += amoomiPaid;
    }

    if (category !== 'khasoosi') {
      switch (amoomiStatus) {
        case 'paid':
          paidCount += 1;
          break;
        case 'partial':
          partialCount += 1;
          break;
        case 'unpaid':
          unpaidCount += 1;
          break;
        case 'not_applicable':
          break;
        default: {
          const _exhaustive: never = amoomiStatus;
          void _exhaustive;
        }
      }
    }

    return {
      muawinId: muawin.id,
      name: muawin.name,
      category,
      committedAmount: committed,
      amoomiPaid,
      khasoosiPaid,
      totalPaid,
      amoomiStatus,
      hasIncome: totalPaid > 0,
    };
  });

  return {
    month,
    rows,
    summary: {
      totalMuawineen: rows.length,
      paidCount,
      partialCount,
      unpaidCount,
      expectedAmoomi,
      receivedAmoomi,
    },
  };
}
