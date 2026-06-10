-- Links Supabase Auth users to tenant-scoped admin access.
-- platform_super_admin rows have tenant_id = null and may access any tenant.
create table if not exists public.platform_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  tenant_id uuid references public.tenants (id) on delete cascade,
  role text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint platform_users_role_check check (
    role in ('platform_super_admin', 'tenant_admin', 'tenant_editor')
  ),
  constraint platform_users_super_admin_no_tenant check (
    (role = 'platform_super_admin' and tenant_id is null)
    or (role <> 'platform_super_admin' and tenant_id is not null)
  )
);

create unique index if not exists platform_users_user_tenant_unique
  on public.platform_users (user_id, tenant_id)
  where tenant_id is not null;

create unique index if not exists platform_users_super_admin_unique
  on public.platform_users (user_id)
  where role = 'platform_super_admin';

create index if not exists platform_users_user_id_idx
  on public.platform_users (user_id);

create index if not exists platform_users_tenant_id_idx
  on public.platform_users (tenant_id);

create trigger platform_users_set_updated_at
  before update on public.platform_users
  for each row
  execute function public.set_updated_at();
