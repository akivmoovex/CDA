-- Custom hostnames mapped to tenants (e.g. www.cda-kafue.org).
create table if not exists public.tenant_domains (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  hostname text not null,
  is_primary boolean not null default false,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  constraint tenant_domains_hostname_unique unique (hostname)
);

create index if not exists tenant_domains_tenant_id_idx
  on public.tenant_domains (tenant_id);

create index if not exists tenant_domains_hostname_idx
  on public.tenant_domains (hostname);
