export type AdminOrgStats = {
  muawineenCount: number;
  totalIncome: number;
  totalExpenses: number;
  latestClosingBalance: number | null;
};

export type AdminPlatformStats = {
  totalOrganizations: number;
  totalMuawineen: number;
  totalIncome: number;
  totalExpenses: number;
};

export type AdminOrganization = {
  id: string;
  name: string;
  currencySymbol: string;
  createdAt: string;
};

export type AdminUserSummary = {
  id: string;
  email: string;
  username: string;
  createdAt: string;
  lastSignInAt: string | null;
  organization: AdminOrganization | null;
  stats: AdminOrgStats | null;
};

export type AdminUserDetail = AdminUserSummary & {
  monthlySummaries: Array<{
    id: string;
    org_id: string;
    month: string;
    total_income: number;
    total_expenses: number;
    closing_balance: number;
    is_deficit: boolean;
  }>;
  recentIncome: Array<{
    id: string;
    amount: number;
    type: string;
    date: string;
    month: string;
    notes: string | null;
  }>;
  recentExpenses: Array<{
    id: string;
    amount: number;
    date: string;
    month: string;
    description: string | null;
  }>;
};

export type AdminMeResponse = {
  isSuperAdmin: boolean;
  userId: string;
  stats: AdminPlatformStats;
};

export type AdminUsersListResponse = {
  users: AdminUserSummary[];
  page: number;
  perPage: number;
  total: number;
};

export type AdminMuawin = {
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

export type AdminMuawinPaymentStatus = 'paid' | 'partial' | 'unpaid' | 'not_applicable';

export type AdminMonthlyMuawinRow = {
  muawinId: string;
  name: string;
  category: 'amoomi' | 'khasoosi' | 'both';
  committedAmount: number;
  amoomiPaid: number;
  khasoosiPaid: number;
  totalPaid: number;
  amoomiStatus: AdminMuawinPaymentStatus;
  hasIncome: boolean;
};

export type AdminMonthlyMuawinReport = {
  month: string;
  rows: AdminMonthlyMuawinRow[];
  summary: {
    totalMuawineen: number;
    paidCount: number;
    partialCount: number;
    unpaidCount: number;
    expectedAmoomi: number;
    receivedAmoomi: number;
  };
};

export type CreateAdminMuawinInput = {
  name: string;
  category: 'amoomi' | 'khasoosi' | 'both';
  amoomi_committed_amount?: number;
  contact_number?: string;
  address?: string;
  detail?: string;
};
