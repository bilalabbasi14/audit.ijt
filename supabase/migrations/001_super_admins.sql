-- Super admin table for platform administrators
create table if not exists public.super_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

alter table public.super_admins enable row level security;

-- No public RLS policies: only service role and SECURITY DEFINER RPC access this table

create or replace function public.is_super_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.super_admins where user_id = auth.uid()
  );
$$;

grant execute on function public.is_super_admin() to authenticated;

-- Seed your first super admin after signup (replace with your auth.users.id):
-- insert into public.super_admins (user_id) values ('YOUR-USER-UUID-HERE');
