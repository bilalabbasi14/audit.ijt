import { supabase } from '@/lib/supabase';
import type {
  AdminMeResponse,
  AdminUserDetail,
  AdminUsersListResponse,
} from '@/types/admin';

class AdminApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function getAccessToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new AdminApiError('Not authenticated', 401);
  }
  return session.access_token;
}

async function adminFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getAccessToken();
  const response = await fetch(path, {
    ...options,
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    throw new AdminApiError(
      'Admin API did not return JSON. Restart the dev server so /api routes run locally.',
      502,
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new AdminApiError(data.error ?? 'Request failed', response.status);
  }

  return data as T;
}

export async function fetchAdminMe(): Promise<AdminMeResponse> {
  return adminFetch<AdminMeResponse>('/api/admin/me');
}

export async function fetchAdminUsers(page = 1, perPage = 50): Promise<AdminUsersListResponse> {
  return adminFetch<AdminUsersListResponse>(`/api/admin/users?page=${page}&perPage=${perPage}`);
}

export async function fetchAdminUserDetail(userId: string): Promise<AdminUserDetail> {
  return adminFetch<AdminUserDetail>(`/api/admin/users/${userId}`);
}

export async function resetUserPassword(userId: string, password: string): Promise<void> {
  await adminFetch<{ success: boolean }>(`/api/admin/users/${userId}/reset-password`, {
    method: 'POST',
    body: JSON.stringify({ password }),
  });
}

export { AdminApiError };
