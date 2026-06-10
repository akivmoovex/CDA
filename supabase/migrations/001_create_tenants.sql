-- Multi-tenant core: organizations served by the platform.
create extension if not exists "pgcrypto";

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  name text not null,
  subdomain text,
  is_default boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tenants_slug_unique unique (slug),
  constraint tenants_subdomain_unique unique (subdomain)
);

create index if not exists tenants_subdomain_idx
  on public.tenants (subdomain)
  where subdomain is not null;

create index if not exists tenants_is_default_idx
  on public.tenants (is_default)
  where is_default = true;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger tenants_set_updated_at
  before update on public.tenants
  for each row
  execute function public.set_updated_at();

-- Only one default tenant at a time.
create or replace function public.enforce_single_default_tenant()
returns trigger
language plpgsql
as $$
begin
  if new.is_default then
    update public.tenants
    set is_default = false
    where id <> new.id
      and is_default = true;
  end if;

  return new;
end;
$$;

create trigger tenants_enforce_single_default
  before insert or update of is_default on public.tenants
  for each row
  execute function public.enforce_single_default_tenant();
