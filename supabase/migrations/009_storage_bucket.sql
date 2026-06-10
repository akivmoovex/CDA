-- Supabase Storage bucket for tenant media uploads.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'tenant-media',
  'tenant-media',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- Public read for published media assets.
create policy tenant_media_public_read on storage.objects for select to anon, authenticated
  using (bucket_id = 'tenant-media');

-- Service role manages uploads; authenticated admins via path prefix in future auth integration.
create policy tenant_media_service_write on storage.objects for insert to service_role
  with check (bucket_id = 'tenant-media');

create policy tenant_media_service_update on storage.objects for update to service_role
  using (bucket_id = 'tenant-media');

create policy tenant_media_service_delete on storage.objects for delete to service_role
  using (bucket_id = 'tenant-media');
