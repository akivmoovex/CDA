-- RLS for media approval tables (admin-only).

alter table public.media_assets enable row level security;
alter table public.media_audit_log enable row level security;

create policy media_assets_admin_all on public.media_assets for all to authenticated
  using (tenant_id in (select public.accessible_tenant_ids()))
  with check (tenant_id in (select public.accessible_tenant_ids()));

create policy media_audit_log_admin_read on public.media_audit_log for select to authenticated
  using (tenant_id in (select public.accessible_tenant_ids()));

-- Public read of approved media metadata only (file URLs served via public storage bucket).
create policy media_assets_public_read_approved on public.media_assets for select to anon, authenticated
  using (approval_status = 'approved');
