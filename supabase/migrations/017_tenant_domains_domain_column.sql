-- tenant_domains uses `domain` (not hostname) for custom domain lookup.
-- Application code queries: .eq('domain', normalizedHost)

-- Align databases created from an older migration that used `hostname`.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'tenant_domains'
      and column_name = 'hostname'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'tenant_domains'
      and column_name = 'domain'
  ) then
    alter table public.tenant_domains rename column hostname to domain;
  end if;
end $$;

-- Expected canonical schema:
-- create table if not exists public.tenant_domains (
--   id uuid primary key default gen_random_uuid(),
--   tenant_id uuid not null references public.tenants(id) on delete cascade,
--   domain text not null unique,
--   is_primary boolean not null default false,
--   created_at timestamptz not null default now()
-- );

-- Seed production custom domains for CDA Kafue (safe to re-run).
insert into public.tenant_domains (tenant_id, domain, is_primary)
select t.id, 'netraz.org', true
from public.tenants t
where t.slug = 'cda-kafue'
on conflict (domain) do update
set
  tenant_id = excluded.tenant_id,
  is_primary = excluded.is_primary;

insert into public.tenant_domains (tenant_id, domain, is_primary)
select t.id, 'www.netraz.org', false
from public.tenants t
where t.slug = 'cda-kafue'
on conflict (domain) do update
set
  tenant_id = excluded.tenant_id,
  is_primary = excluded.is_primary;
