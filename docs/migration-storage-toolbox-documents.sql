-- Bucket Storage pour les documents de la boîte à outils (upload prioritaire)
-- À exécuter dans Supabase SQL Editor après avoir activé Storage.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'toolbox-documents',
  'toolbox-documents',
  false,
  52428800,
  array['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'image/png', 'image/jpeg', 'video/mp4', 'video/webm', 'text/plain']
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "toolbox_documents_insert" on storage.objects;
create policy "toolbox_documents_insert" on storage.objects for insert
with check (
  bucket_id = 'toolbox-documents'
  and exists (select 1 from public.staff_users s where s.auth_user_id = auth.uid() and s.role in ('ADMIN_ORG', 'ADMIN'))
);

drop policy if exists "toolbox_documents_update" on storage.objects;
create policy "toolbox_documents_update" on storage.objects for update
using (bucket_id = 'toolbox-documents' and exists (select 1 from public.staff_users s where s.auth_user_id = auth.uid() and s.role in ('ADMIN_ORG', 'ADMIN')));

drop policy if exists "toolbox_documents_delete" on storage.objects;
create policy "toolbox_documents_delete" on storage.objects for delete
using (bucket_id = 'toolbox-documents' and exists (select 1 from public.staff_users s where s.auth_user_id = auth.uid() and s.role in ('ADMIN_ORG', 'ADMIN')));

drop policy if exists "toolbox_documents_select" on storage.objects;
create policy "toolbox_documents_select" on storage.objects for select
using (
  bucket_id = 'toolbox-documents'
  and (exists (select 1 from public.staff_users s where s.auth_user_id = auth.uid())
    or exists (select 1 from public.incubes i where i.auth_user_id = auth.uid()))
);
