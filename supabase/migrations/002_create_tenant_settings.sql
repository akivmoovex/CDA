-- Per-tenant public site content and configuration.
create table if not exists public.tenant_settings (
  tenant_id uuid primary key references public.tenants (id) on delete cascade,
  tagline text,
  hero_title text,
  hero_body text,
  primary_cta_label text,
  primary_cta_url text,
  donate_cta_label text,
  donate_cta_url text,
  contact_email text,
  contact_phone text,
  logo_url text,
  favicon_url text,
  meta_title text,
  meta_description text,
  footer_text text,
  extra jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger tenant_settings_set_updated_at
  before update on public.tenant_settings
  for each row
  execute function public.set_updated_at();
