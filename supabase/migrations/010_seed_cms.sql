-- Seed published CMS content for CDA Kafue (idempotent).

insert into public.cms_homepage_sections (
  tenant_id, section_key, title, subtitle, body, cta_label, cta_url, sort_order, status, published_at
)
select
  t.id,
  v.section_key,
  v.title,
  v.subtitle,
  v.body,
  v.cta_label,
  v.cta_url,
  v.sort_order,
  'published'::public.cms_status,
  now()
from public.tenants t
cross join (
  values
    (
      'hero',
      'Building brighter futures for children in Kafue',
      'Community Guardian',
      'Child Development Agency Kafue connects donors, partners, and local communities through transparent, child-centered development programs.',
      'Our Programs',
      '/programs',
      1
    ),
    (
      'about',
      'Nurturing Hope, One Child at a Time',
      'Our Story',
      'Founded on the belief that geography should not define a child''s potential, CDAK has been at the forefront of development in Kafue for over a decade.',
      'Learn more about our mission',
      '/about',
      2
    )
) as v(section_key, title, subtitle, body, cta_label, cta_url, sort_order)
where t.slug = 'cda-kafue'
on conflict (tenant_id, section_key) do update
set
  title = excluded.title,
  subtitle = excluded.subtitle,
  body = excluded.body,
  cta_label = excluded.cta_label,
  cta_url = excluded.cta_url,
  sort_order = excluded.sort_order,
  status = excluded.status,
  published_at = excluded.published_at;

insert into public.cms_programs (
  tenant_id, slug, title, category, summary, body, progress, progress_label,
  objectives, outcomes, sort_order, status, published_at
)
select
  t.id,
  v.slug,
  v.title,
  v.category,
  v.summary,
  v.body,
  v.progress,
  v.progress_label,
  v.objectives::jsonb,
  v.outcomes::jsonb,
  v.sort_order,
  'published'::public.cms_status,
  now()
from public.tenants t
cross join (
  values
    (
      'education-support',
      'Education Support',
      'Education',
      'Providing scholarships, school supplies, and teacher training to ensure every child has access to quality learning.',
      'Our Education Support program removes financial and material barriers so children in Kafue can stay in school and succeed.',
      75,
      '75% of yearly goal reached',
      '["Scholarships for vulnerable students","School supplies and uniform support","Teacher training and classroom resources"]',
      '[{"label":"Students on scholarship","value":"420"},{"label":"Schools supported","value":"18"}]',
      1
    ),
    (
      'health-nutrition',
      'Health & Nutrition',
      'Health',
      'Mobile clinics and nutrition programs ensuring the physical well-being of the next generation.',
      'Healthy children learn better. We deliver essential care, nutrition support, and health education across Kafue.',
      40,
      '40% of yearly goal reached',
      '["Mobile clinic outreach","Malnutrition screening and support","Maternal and child health education"]',
      '[{"label":"Clinic visits this year","value":"2800"},{"label":"Nutrition packs delivered","value":"1150"}]',
      2
    )
) as v(slug, title, category, summary, body, progress, progress_label, objectives, outcomes, sort_order)
where t.slug = 'cda-kafue'
on conflict (tenant_id, slug) do update
set
  title = excluded.title,
  category = excluded.category,
  summary = excluded.summary,
  body = excluded.body,
  progress = excluded.progress,
  progress_label = excluded.progress_label,
  objectives = excluded.objectives,
  outcomes = excluded.outcomes,
  sort_order = excluded.sort_order,
  status = excluded.status,
  published_at = excluded.published_at;

insert into public.cms_news_posts (
  tenant_id, slug, title, category, excerpt, body, author, featured, status, published_at
)
select
  t.id,
  v.slug,
  v.title,
  v.category,
  v.excerpt,
  v.body,
  v.author,
  v.featured,
  'published'::public.cms_status,
  v.published_at::timestamptz
from public.tenants t
cross join (
  values
    (
      'annual-community-forum-2024',
      'Annual Community Forum Highlights 2024 Goals',
      'Featured Story',
      'Over 300 community members gathered last week to discuss the expansion of our skills center.',
      'Community leaders, parents, teachers, and youth representatives joined CDAK for our annual forum.',
      'CDAK Communications',
      true,
      '2024-08-12'
    ),
    (
      'new-community-library-opens',
      'New Community Library Opens Its Doors',
      'Education',
      'A landmark achievement for local education, providing resources for over 500 children.',
      'The new library offers reading spaces, after-school tutoring, and digital learning stations.',
      'Program Team',
      false,
      '2024-07-03'
    )
) as v(slug, title, category, excerpt, body, author, featured, published_at)
where t.slug = 'cda-kafue'
on conflict (tenant_id, slug) do update
set
  title = excluded.title,
  category = excluded.category,
  excerpt = excluded.excerpt,
  body = excluded.body,
  author = excluded.author,
  featured = excluded.featured,
  status = excluded.status,
  published_at = excluded.published_at;

insert into public.cms_events (
  tenant_id, slug, title, summary, location, event_date, event_time, featured, status, published_at
)
select
  t.id,
  v.slug,
  v.title,
  v.summary,
  v.location,
  v.event_date::date,
  v.event_time,
  v.featured,
  'published'::public.cms_status,
  now()
from public.tenants t
cross join (
  values
    (
      'kafue-youth-marathon',
      'Kafue Youth Marathon',
      'Join us for our annual fundraising run to support youth sports programs.',
      'Kafue City Stadium',
      '2024-09-12',
      '08:00',
      true
    ),
    (
      'annual-fundraising-gala',
      'Annual Fundraising Gala',
      'An evening celebrating community impact with partners, donors, and local leaders.',
      'Kafue City Hall',
      '2024-10-15',
      '18:30',
      false
    )
) as v(slug, title, summary, location, event_date, event_time, featured)
where t.slug = 'cda-kafue'
on conflict (tenant_id, slug) do update
set
  title = excluded.title,
  summary = excluded.summary,
  location = excluded.location,
  event_date = excluded.event_date,
  event_time = excluded.event_time,
  featured = excluded.featured,
  status = excluded.status,
  published_at = excluded.published_at;

insert into public.cms_gallery_items (tenant_id, title, category, sort_order, status, published_at)
select
  t.id,
  v.title,
  v.category,
  v.sort_order,
  'published'::public.cms_status,
  now()
from public.tenants t
cross join (
  values
    ('Community Learning Day', 'Education', 1),
    ('Mobile Clinic Outreach', 'Health', 2),
    ('Skills Workshop', 'Empowerment', 3)
) as v(title, category, sort_order)
where t.slug = 'cda-kafue';

insert into public.cms_resources (
  tenant_id, slug, title, description, file_type, file_size, status, published_at
)
select
  t.id,
  v.slug,
  v.title,
  v.description,
  v.file_type,
  v.file_size,
  'published'::public.cms_status,
  now()
from public.tenants t
cross join (
  values
    (
      '2023-annual-impact-report',
      '2023 Annual Impact Report',
      'Full transparency report covering programs, finances, and outcomes.',
      'PDF',
      '2.4 MB'
    ),
    (
      'child-safeguarding-policy',
      'Child Safeguarding Policy',
      'Our standards for protecting children in all CDAK activities.',
      'PDF',
      '840 KB'
    )
) as v(slug, title, description, file_type, file_size)
where t.slug = 'cda-kafue'
on conflict (tenant_id, slug) do update
set
  title = excluded.title,
  description = excluded.description,
  file_type = excluded.file_type,
  file_size = excluded.file_size,
  status = excluded.status,
  published_at = excluded.published_at;

insert into public.cms_pages (tenant_id, slug, title, body, status, published_at)
select
  t.id,
  'about',
  'About Us',
  'Child Development Agency Kafue is committed to sturdy hope — professional rigor and grassroots warmth in every program we run.',
  'published'::public.cms_status,
  now()
from public.tenants t
where t.slug = 'cda-kafue'
on conflict (tenant_id, slug) do update
set
  title = excluded.title,
  body = excluded.body,
  status = excluded.status,
  published_at = excluded.published_at;
