-- Placeholder child profiles for internal sponsor matching (CDA Kafue).

insert into public.sponsorship_children (
  tenant_id, reference_code, display_name, age_range, program_area, is_available, notes
)
select
  t.id,
  v.reference_code,
  v.display_name,
  v.age_range,
  v.program_area,
  true,
  'Placeholder profile for internal matching.'
from public.tenants t
cross join (
  values
    ('CH-001', 'Student A', '8-10', 'Education Support'),
    ('CH-002', 'Student B', '11-13', 'Education Support'),
    ('CH-003', 'Student C', '14-16', 'Skills Development')
) as v(reference_code, display_name, age_range, program_area)
where t.slug = 'cda-kafue'
on conflict (tenant_id, reference_code) do update
set
  display_name = excluded.display_name,
  age_range = excluded.age_range,
  program_area = excluded.program_area,
  notes = excluded.notes;
