-- Canonical tenant schema uses status (not is_active/is_default) and domain-based routing.
-- Tenant lookup: tenant_domains.domain -> tenants.id (UUID).
-- Do not query tenants.subdomain; custom hosts are mapped in tenant_domains.

-- Align legacy tenants table if older columns exist.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'tenants'
      and column_name = 'is_active'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'tenants'
      and column_name = 'status'
  ) then
    alter table public.tenants add column status text not null default 'active';
    update public.tenants set status = case when is_active then 'active' else 'inactive' end;
  end if;
end $$;

-- Align tenant_settings to support site_name and branding fields when missing.
alter table public.tenant_settings add column if not exists site_name text;
alter table public.tenant_settings add column if not exists primary_color text;
alter table public.tenant_settings add column if not exists secondary_color text;
alter table public.tenant_settings add column if not exists address text;

-- Expected tenant_domains shape:
-- id uuid primary key
-- tenant_id uuid references public.tenants(id)
-- domain text not null unique
-- is_primary boolean not null default false
-- created_at timestamptz not null default now()

insert into public.tenants (slug, name, status)
values ('cda-kafue', 'Child Development Agency Kafue', 'active')
on conflict (slug) do update
set
  name = excluded.name,
  status = excluded.status;

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

insert into public.tenant_settings (
  tenant_id,
  site_name,
  meta_title,
  meta_description,
  primary_color,
  secondary_color
)
select
  t.id,
  'Child Development Agency Kafue',
  'Child Development Agency Kafue',
  'A child development and community support agency website for CDA Kafue.',
  '#1D4ED8',
  '#16A34A'
from public.tenants t
where t.slug = 'cda-kafue'
on conflict (tenant_id) do update
set
  site_name = excluded.site_name,
  meta_title = excluded.meta_title,
  meta_description = excluded.meta_description,
  primary_color = excluded.primary_color,
  secondary_color = excluded.secondary_color;
