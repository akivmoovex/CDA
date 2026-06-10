-- RLS for CMS tables.

alter table public.cms_pages enable row level security;
alter table public.cms_homepage_sections enable row level security;
alter table public.cms_programs enable row level security;
alter table public.cms_news_posts enable row level security;
alter table public.cms_events enable row level security;
alter table public.cms_gallery_items enable row level security;
alter table public.cms_resources enable row level security;
alter table public.cms_audit_log enable row level security;

-- Public read of published CMS content.
create policy cms_pages_public_read on public.cms_pages for select to anon, authenticated
  using (status = 'published');
create policy cms_homepage_sections_public_read on public.cms_homepage_sections for select to anon, authenticated
  using (status = 'published');
create policy cms_programs_public_read on public.cms_programs for select to anon, authenticated
  using (status = 'published');
create policy cms_news_posts_public_read on public.cms_news_posts for select to anon, authenticated
  using (status = 'published');
create policy cms_events_public_read on public.cms_events for select to anon, authenticated
  using (status = 'published');
create policy cms_gallery_items_public_read on public.cms_gallery_items for select to anon, authenticated
  using (status = 'published');
create policy cms_resources_public_read on public.cms_resources for select to anon, authenticated
  using (status = 'published');

-- Tenant admins read/write accessible tenant CMS rows.
create policy cms_pages_admin_all on public.cms_pages for all to authenticated
  using (tenant_id in (select public.accessible_tenant_ids()))
  with check (tenant_id in (select public.accessible_tenant_ids()));
create policy cms_homepage_sections_admin_all on public.cms_homepage_sections for all to authenticated
  using (tenant_id in (select public.accessible_tenant_ids()))
  with check (tenant_id in (select public.accessible_tenant_ids()));
create policy cms_programs_admin_all on public.cms_programs for all to authenticated
  using (tenant_id in (select public.accessible_tenant_ids()))
  with check (tenant_id in (select public.accessible_tenant_ids()));
create policy cms_news_posts_admin_all on public.cms_news_posts for all to authenticated
  using (tenant_id in (select public.accessible_tenant_ids()))
  with check (tenant_id in (select public.accessible_tenant_ids()));
create policy cms_events_admin_all on public.cms_events for all to authenticated
  using (tenant_id in (select public.accessible_tenant_ids()))
  with check (tenant_id in (select public.accessible_tenant_ids()));
create policy cms_gallery_items_admin_all on public.cms_gallery_items for all to authenticated
  using (tenant_id in (select public.accessible_tenant_ids()))
  with check (tenant_id in (select public.accessible_tenant_ids()));
create policy cms_resources_admin_all on public.cms_resources for all to authenticated
  using (tenant_id in (select public.accessible_tenant_ids()))
  with check (tenant_id in (select public.accessible_tenant_ids()));

-- Audit log readable by tenant admins; inserts via service role from Express.
create policy cms_audit_log_admin_read on public.cms_audit_log for select to authenticated
  using (tenant_id in (select public.accessible_tenant_ids()));
