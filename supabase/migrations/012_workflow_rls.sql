-- RLS for volunteer and sponsorship workflow tables (admin-only access).

alter table public.volunteer_applications enable row level security;
alter table public.volunteer_assignments enable row level security;
alter table public.sponsorship_requests enable row level security;
alter table public.sponsor_records enable row level security;
alter table public.sponsorship_children enable row level security;

create policy volunteer_applications_admin_all on public.volunteer_applications for all to authenticated
  using (tenant_id in (select public.accessible_tenant_ids()))
  with check (tenant_id in (select public.accessible_tenant_ids()));

create policy volunteer_assignments_admin_all on public.volunteer_assignments for all to authenticated
  using (tenant_id in (select public.accessible_tenant_ids()))
  with check (tenant_id in (select public.accessible_tenant_ids()));

create policy sponsorship_requests_admin_all on public.sponsorship_requests for all to authenticated
  using (tenant_id in (select public.accessible_tenant_ids()))
  with check (tenant_id in (select public.accessible_tenant_ids()));

create policy sponsor_records_admin_all on public.sponsor_records for all to authenticated
  using (tenant_id in (select public.accessible_tenant_ids()))
  with check (tenant_id in (select public.accessible_tenant_ids()));

create policy sponsorship_children_admin_all on public.sponsorship_children for all to authenticated
  using (tenant_id in (select public.accessible_tenant_ids()))
  with check (tenant_id in (select public.accessible_tenant_ids()));
