-- Bootstrap tenant for Child Development Agency Kafue.
insert into public.tenants (slug, name, subdomain, is_default, is_active)
values (
  'cda-kafue',
  'Child Development Agency Kafue',
  'cda-kafue',
  true,
  true
)
on conflict (slug) do update
set
  name = excluded.name,
  subdomain = excluded.subdomain,
  is_default = excluded.is_default,
  is_active = excluded.is_active;

insert into public.tenant_settings (
  tenant_id,
  tagline,
  hero_title,
  hero_body,
  primary_cta_label,
  primary_cta_url,
  donate_cta_label,
  donate_cta_url,
  meta_title,
  meta_description,
  footer_text
)
select
  t.id,
  'Community Guardian',
  'Building brighter futures for children in Kafue',
  'Child Development Agency Kafue connects donors, partners, and local communities through transparent, child-centered development programs.',
  'Our Programs',
  '/programs',
  'Donate',
  '/donate',
  'Child Development Agency Kafue — Community Guardian',
  'Transparent, child-centered development programs in Kafue.',
  'Committed to sturdy hope — professional rigor and grassroots warmth.'
from public.tenants t
where t.slug = 'cda-kafue'
on conflict (tenant_id) do update
set
  tagline = excluded.tagline,
  hero_title = excluded.hero_title,
  hero_body = excluded.hero_body,
  primary_cta_label = excluded.primary_cta_label,
  primary_cta_url = excluded.primary_cta_url,
  donate_cta_label = excluded.donate_cta_label,
  donate_cta_url = excluded.donate_cta_url,
  meta_title = excluded.meta_title,
  meta_description = excluded.meta_description,
  footer_text = excluded.footer_text;
