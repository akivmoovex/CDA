-- Volunteer and sponsorship workflow tables (tenant-scoped).

create type public.volunteer_application_status as enum ('pending', 'approved', 'rejected');
create type public.sponsorship_request_status as enum ('pending', 'contacted', 'matched', 'rejected');
create type public.sponsor_record_status as enum ('active', 'paused', 'ended');
create type public.volunteer_assignment_status as enum ('scheduled', 'active', 'completed', 'cancelled');

create table if not exists public.volunteer_applications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  interest_area text,
  availability text,
  message text,
  status public.volunteer_application_status not null default 'pending',
  admin_comments text,
  reviewed_at timestamptz,
  reviewed_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.volunteer_assignments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  application_id uuid not null references public.volunteer_applications (id) on delete cascade,
  title text not null,
  description text,
  location text,
  start_date date,
  end_date date,
  status public.volunteer_assignment_status not null default 'scheduled',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sponsor_records (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  tier_name text,
  monthly_amount text,
  status public.sponsor_record_status not null default 'active',
  notes text,
  request_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sponsorship_requests (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  tier_name text,
  monthly_amount text,
  message text,
  status public.sponsorship_request_status not null default 'pending',
  admin_comments text,
  reviewed_at timestamptz,
  reviewed_by text,
  sponsor_record_id uuid references public.sponsor_records (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.sponsor_records
  add constraint sponsor_records_request_id_fkey
  foreign key (request_id) references public.sponsorship_requests (id) on delete set null;

-- Placeholder child profiles for internal matching (anonymized references only).
create table if not exists public.sponsorship_children (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  reference_code text not null,
  display_name text not null,
  age_range text,
  program_area text,
  is_available boolean not null default true,
  notes text,
  sponsor_record_id uuid references public.sponsor_records (id) on delete set null,
  matched_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sponsorship_children_tenant_code_unique unique (tenant_id, reference_code)
);

create index if not exists volunteer_applications_tenant_status_idx
  on public.volunteer_applications (tenant_id, status, created_at desc);
create index if not exists volunteer_assignments_application_idx
  on public.volunteer_assignments (application_id);
create index if not exists sponsorship_requests_tenant_status_idx
  on public.sponsorship_requests (tenant_id, status, created_at desc);
create index if not exists sponsor_records_tenant_status_idx
  on public.sponsor_records (tenant_id, status, created_at desc);
create index if not exists sponsorship_children_tenant_available_idx
  on public.sponsorship_children (tenant_id, is_available);

create trigger volunteer_applications_set_updated_at before update on public.volunteer_applications
  for each row execute function public.set_updated_at();
create trigger volunteer_assignments_set_updated_at before update on public.volunteer_assignments
  for each row execute function public.set_updated_at();
create trigger sponsorship_requests_set_updated_at before update on public.sponsorship_requests
  for each row execute function public.set_updated_at();
create trigger sponsor_records_set_updated_at before update on public.sponsor_records
  for each row execute function public.set_updated_at();
create trigger sponsorship_children_set_updated_at before update on public.sponsorship_children
  for each row execute function public.set_updated_at();
