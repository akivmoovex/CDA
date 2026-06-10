-- Storage bucket policies for tenant-media, resources, and private-documents.
-- Buckets are expected to already exist in Supabase; this migration idempotently
-- configures metadata and RLS policies.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'tenant-media',
    'tenant-media',
    true,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  ),
  (
    'resources',
    'resources',
    true,
    10485760,
    array['application/pdf']
  ),
  (
    'private-documents',
    'private-documents',
    false,
    10485760,
    array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
  )
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Private bucket: service role manages objects (no public read).
create policy private_documents_service_all on storage.objects for all to service_role
  using (bucket_id = 'private-documents')
  with check (bucket_id = 'private-documents');

create policy resources_public_read on storage.objects for select to anon, authenticated
  using (bucket_id = 'resources');

create policy resources_service_write on storage.objects for insert to service_role
  with check (bucket_id = 'resources');

create policy resources_service_update on storage.objects for update to service_role
  using (bucket_id = 'resources');

create policy resources_service_delete on storage.objects for delete to service_role
  using (bucket_id = 'resources');

alter table public.media_assets
  add column if not exists storage_bucket text;

update public.media_assets
set storage_bucket = 'tenant-media'
where storage_bucket is null and file_url like '%/tenant-media/%';

update public.media_assets
set storage_bucket = 'private-documents'
where storage_bucket is null and is_child_related = true;
