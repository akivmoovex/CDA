-- CMS content tables (all tenant-scoped).

create type public.cms_status as enum ('draft', 'published');

create table if not exists public.cms_pages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  slug text not null,
  title text not null,
  body text,
  meta_title text,
  meta_description text,
  status public.cms_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cms_pages_tenant_slug_unique unique (tenant_id, slug)
);

create table if not exists public.cms_homepage_sections (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  section_key text not null,
  title text,
  subtitle text,
  body text,
  image_url text,
  cta_label text,
  cta_url text,
  extra jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  status public.cms_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cms_homepage_sections_tenant_key_unique unique (tenant_id, section_key)
);

create table if not exists public.cms_programs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  slug text not null,
  title text not null,
  category text,
  summary text,
  body text,
  image_url text,
  hero_image_url text,
  progress integer,
  progress_label text,
  objectives jsonb not null default '[]'::jsonb,
  outcomes jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0,
  status public.cms_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cms_programs_tenant_slug_unique unique (tenant_id, slug)
);

create table if not exists public.cms_news_posts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  slug text not null,
  title text not null,
  category text,
  excerpt text,
  body text,
  image_url text,
  author text,
  featured boolean not null default false,
  status public.cms_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cms_news_posts_tenant_slug_unique unique (tenant_id, slug)
);

create table if not exists public.cms_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  slug text not null,
  title text not null,
  summary text,
  location text,
  event_date date not null,
  event_time text,
  featured boolean not null default false,
  status public.cms_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cms_events_tenant_slug_unique unique (tenant_id, slug)
);

create table if not exists public.cms_gallery_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  title text not null,
  category text,
  image_url text,
  sort_order integer not null default 0,
  status public.cms_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cms_resources (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  slug text not null,
  title text not null,
  description text,
  file_url text,
  file_type text,
  file_size text,
  status public.cms_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cms_resources_tenant_slug_unique unique (tenant_id, slug)
);

create type public.cms_audit_action as enum (
  'create',
  'update',
  'delete',
  'publish',
  'unpublish'
);

create table if not exists public.cms_audit_log (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  entity_type text not null,
  entity_id uuid,
  action public.cms_audit_action not null,
  user_id text,
  user_email text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists cms_pages_tenant_status_idx on public.cms_pages (tenant_id, status);
create index if not exists cms_programs_tenant_status_idx on public.cms_programs (tenant_id, status);
create index if not exists cms_news_posts_tenant_status_idx on public.cms_news_posts (tenant_id, status);
create index if not exists cms_events_tenant_status_idx on public.cms_events (tenant_id, status);
create index if not exists cms_gallery_items_tenant_status_idx on public.cms_gallery_items (tenant_id, status);
create index if not exists cms_resources_tenant_status_idx on public.cms_resources (tenant_id, status);
create index if not exists cms_audit_log_tenant_created_idx on public.cms_audit_log (tenant_id, created_at desc);

create trigger cms_pages_set_updated_at before update on public.cms_pages
  for each row execute function public.set_updated_at();
create trigger cms_homepage_sections_set_updated_at before update on public.cms_homepage_sections
  for each row execute function public.set_updated_at();
create trigger cms_programs_set_updated_at before update on public.cms_programs
  for each row execute function public.set_updated_at();
create trigger cms_news_posts_set_updated_at before update on public.cms_news_posts
  for each row execute function public.set_updated_at();
create trigger cms_events_set_updated_at before update on public.cms_events
  for each row execute function public.set_updated_at();
create trigger cms_gallery_items_set_updated_at before update on public.cms_gallery_items
  for each row execute function public.set_updated_at();
create trigger cms_resources_set_updated_at before update on public.cms_resources
  for each row execute function public.set_updated_at();
