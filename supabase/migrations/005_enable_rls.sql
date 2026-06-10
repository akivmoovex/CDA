-- Row Level Security for multi-tenant data access.

alter table public.tenants enable row level security;
alter table public.tenant_settings enable row level security;
alter table public.tenant_domains enable row level security;
alter table public.platform_users enable row level security;

-- Public read of active tenants (hostname resolution + public pages).
create policy tenants_public_read_active
  on public.tenants
  for select
  to anon, authenticated
  using (is_active = true);

-- Public read of settings for active tenants.
create policy tenant_settings_public_read
  on public.tenant_settings
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.tenants t
      where t.id = tenant_settings.tenant_id
        and t.is_active = true
    )
  );

-- Public read of verified custom domains (or all domains if not yet verified in dev).
create policy tenant_domains_public_read
  on public.tenant_domains
  for select
  to anon, authenticated
  using (true);

-- Users can read their own platform membership row(s).
create policy platform_users_read_own
  on public.platform_users
  for select
  to authenticated
  using (user_id = auth.uid());

-- Tenant admins may read co-workers within the same tenant.
create policy platform_users_read_same_tenant
  on public.platform_users
  for select
  to authenticated
  using (
    tenant_id is not null
    and tenant_id in (
      select pu.tenant_id
      from public.platform_users pu
      where pu.user_id = auth.uid()
        and pu.role in ('tenant_admin', 'tenant_editor')
    )
  );

-- Super admins may read all platform user rows.
create policy platform_users_read_super_admin
  on public.platform_users
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.platform_users pu
      where pu.user_id = auth.uid()
        and pu.role = 'platform_super_admin'
    )
  );

-- Helper: true when the current user is a platform super admin.
create or replace function public.is_platform_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.platform_users
    where user_id = auth.uid()
      and role = 'platform_super_admin'
  );
$$;

-- Helper: tenant IDs the current user may administer.
create or replace function public.accessible_tenant_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select pu.tenant_id
  from public.platform_users pu
  where pu.user_id = auth.uid()
    and pu.tenant_id is not null
  union
  select t.id
  from public.tenants t
  where public.is_platform_super_admin();
$$;

-- Authenticated tenant admins can read their tenant (including inactive for admin UI).
create policy tenants_admin_read
  on public.tenants
  for select
  to authenticated
  using (id in (select public.accessible_tenant_ids()));

-- Authenticated tenant admins can read settings for accessible tenants.
create policy tenant_settings_admin_read
  on public.tenant_settings
  for select
  to authenticated
  using (tenant_id in (select public.accessible_tenant_ids()));

-- Service role bypasses RLS; Express server uses service role for public SSR lookups.
