export type Organization = {
  id: string;
  name: string;
  currency_symbol: string;
  created_at: string;
};

export type Muawin = {
  id: string;
  org_id: string;
  name: string;
  contact_number: string | null;
  address: string | null;
  detail: string | null;
  category: 'amoomi' | 'khasoosi' | 'both';
  amoomi_committed_amount: number | null;
  created_at: string;
  updated_at: string;
};

export type ExpenseCategory = {
  id: string;
  org_id: string;
  name: string;
  is_default: boolean;
  created_at: string;
};

export type IncomeEntry = {
  id: string;
  org_id: string;
  muawin_id: string;
  amount: number;
  type: 'amoomi' | 'khasoosi';
  khasoosi_purpose: string | null;
  date: string;
  month: string; // YYYY-MM
  notes: string | null;
  created_at: string;
};

export type ExpenseEntry = {
  id: string;
  org_id: string;
  category_id: string;
  amount: number;
  date: string;
  month: string; // YYYY-MM
  description: string | null;
  created_at: string;
};

export type MonthlySummary = {
  id: string;
  org_id: string;
  month: string; // YYYY-MM
  total_income: number;
  total_amoomi_income: number;
  total_khasoosi_income: number;
  total_expected_amoomi: number;
  total_expenses: number;
  last_month_balance: number;
  closing_balance: number;
  is_deficit: boolean;
  created_at: string;
  updated_at: string;
};
