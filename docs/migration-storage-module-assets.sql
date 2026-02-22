-- Bucket Storage pour les assets des modules (vidéos, documents uploadés)
-- À exécuter dans Supabase SQL Editor après avoir activé Storage.

-- Créer le bucket (privé ; accès via URL signée)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'module-assets',
  'module-assets',
  false,
  52428800,
  array['video/mp4', 'video/webm', 'video/quicktime', 'application/pdf', 'image/png', 'image/jpeg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Politiques : admins org peuvent écrire ; staff et incubés peuvent lire (URL signée côté app)
drop policy if exists "module_assets_insert" on storage.objects;
create policy "module_assets_insert" on storage.objects for insert
with check (
  bucket_id = 'module-assets'
  and exists (select 1 from public.staff_users s where s.auth_user_id = auth.uid() and s.role in ('ADMIN_ORG', 'ADMIN'))
);

drop policy if exists "module_assets_update" on storage.objects;
create policy "module_assets_update" on storage.objects for update
using (bucket_id = 'module-assets' and exists (select 1 from public.staff_users s where s.auth_user_id = auth.uid() and s.role in ('ADMIN_ORG', 'ADMIN')));

drop policy if exists "module_assets_delete" on storage.objects;
create policy "module_assets_delete" on storage.objects for delete
using (bucket_id = 'module-assets' and exists (select 1 from public.staff_users s where s.auth_user_id = auth.uid() and s.role in ('ADMIN_ORG', 'ADMIN')));

drop policy if exists "module_assets_select" on storage.objects;
create policy "module_assets_select" on storage.objects for select
using (
  bucket_id = 'module-assets'
  and (exists (select 1 from public.staff_users s where s.auth_user_id = auth.uid())
    or exists (select 1 from public.incubes i where i.auth_user_id = auth.uid()))
);
