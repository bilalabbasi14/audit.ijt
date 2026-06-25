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
