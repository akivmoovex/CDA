-- Safeguarding media approval tables (tenant-scoped).

create type public.media_consent_status as enum (
  'unknown',
  'pending',
  'recorded',
  'missing',
  'not_required'
);

create type public.media_approval_status as enum (
  'private',
  'pending_review',
  'approved',
  'rejected',
  'changes_requested'
);

create type public.media_audit_action as enum (
  'upload',
  'update',
  'submit_review',
  'approve',
  'reject',
  'request_changes',
  'consent_recorded',
  'set_private',
  'delete'
);

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  title text not null,
  description text,
  file_url text not null,
  storage_path text,
  mime_type text,
  media_kind text not null default 'photo',
  tags jsonb not null default '[]'::jsonb,
  is_child_related boolean not null default false,
  consent_status public.media_consent_status not null default 'unknown',
  approval_status public.media_approval_status not null default 'private',
  reviewer_comments text,
  reviewed_at timestamptz,
  reviewed_by text,
  uploaded_by text,
  gallery_item_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.media_audit_log (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  media_id uuid references public.media_assets (id) on delete set null,
  action public.media_audit_action not null,
  user_id text,
  user_email text,
  comments text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.cms_gallery_items
  add column if not exists media_asset_id uuid references public.media_assets (id) on delete set null;

alter table public.media_assets
  add constraint media_assets_gallery_item_id_fkey
  foreign key (gallery_item_id) references public.cms_gallery_items (id) on delete set null;

create index if not exists media_assets_tenant_approval_idx
  on public.media_assets (tenant_id, approval_status, created_at desc);
create index if not exists media_assets_tenant_child_idx
  on public.media_assets (tenant_id, is_child_related, approval_status);
create index if not exists media_audit_log_media_created_idx
  on public.media_audit_log (media_id, created_at desc);
create index if not exists media_audit_log_tenant_created_idx
  on public.media_audit_log (tenant_id, created_at desc);

create trigger media_assets_set_updated_at before update on public.media_assets
  for each row execute function public.set_updated_at();
