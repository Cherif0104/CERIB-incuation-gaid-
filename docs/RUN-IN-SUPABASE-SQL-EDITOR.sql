-- =============================================================================
-- À exécuter dans l'éditeur SQL Supabase (Dashboard → SQL Editor).
-- Coller le contenu de CE FICHIER (ou un bloc à la fois) et cliquer sur "Run".
-- Ne pas coller les noms de fichiers ni le markdown : uniquement du SQL.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1/3 — learning_modules : colonnes promotion_id et formateur_id
-- (Évite l'erreur "column learning_modules.promotion_id does not exist")
-- -----------------------------------------------------------------------------
alter table public.learning_modules
  add column if not exists promotion_id text references public.promotions(id) on delete restrict;
alter table public.learning_modules
  add column if not exists formateur_id uuid references public.staff_users(id) on delete restrict;

create index if not exists idx_learning_modules_promotion on public.learning_modules (promotion_id);
create index if not exists idx_learning_modules_formateur on public.learning_modules (formateur_id);

comment on column public.learning_modules.promotion_id is 'Promotion à laquelle le module est associé (obligatoire à la création)';
comment on column public.learning_modules.formateur_id is 'Formateur/entraîneur (coach) responsable du module (obligatoire à la création)';


-- -----------------------------------------------------------------------------
-- 2/3 — RLS Admin Org : supprimer/modifier les modules de son organisation
-- -----------------------------------------------------------------------------
drop policy if exists learning_modules_admin_org on public.learning_modules;
create policy learning_modules_admin_org
  on public.learning_modules for all
  using (
    organisation_id is null
    or organisation_id in (
      select organisation_id from public.staff_users
      where auth_user_id = auth.uid() and role in ('ADMIN_ORG', 'ADMIN')
    )
  )
  with check (
    organisation_id is null
    or organisation_id in (
      select organisation_id from public.staff_users
      where auth_user_id = auth.uid() and role in ('ADMIN_ORG', 'ADMIN')
    )
  );

drop policy if exists module_quiz_questions_admin_org on public.module_quiz_questions;
create policy module_quiz_questions_admin_org
  on public.module_quiz_questions for all
  using (
    exists (
      select 1 from public.learning_modules m
      where m.id = module_id
      and (m.organisation_id is null or m.organisation_id in (
        select organisation_id from public.staff_users
        where auth_user_id = auth.uid() and role in ('ADMIN_ORG', 'ADMIN')
      ))
    )
  )
  with check (
    exists (
      select 1 from public.learning_modules m
      where m.id = module_id
      and (m.organisation_id is null or m.organisation_id in (
        select organisation_id from public.staff_users
        where auth_user_id = auth.uid() and role in ('ADMIN_ORG', 'ADMIN')
      ))
    )
  );

drop policy if exists module_quiz_choices_admin_org on public.module_quiz_choices;
create policy module_quiz_choices_admin_org
  on public.module_quiz_choices for all
  using (
    exists (
      select 1 from public.module_quiz_questions q
      join public.learning_modules m on m.id = q.module_id
      where q.id = question_id
      and (m.organisation_id is null or m.organisation_id in (
        select organisation_id from public.staff_users
        where auth_user_id = auth.uid() and role in ('ADMIN_ORG', 'ADMIN')
      ))
    )
  )
  with check (
    exists (
      select 1 from public.module_quiz_questions q
      join public.learning_modules m on m.id = q.module_id
      where q.id = question_id
      and (m.organisation_id is null or m.organisation_id in (
        select organisation_id from public.staff_users
        where auth_user_id = auth.uid() and role in ('ADMIN_ORG', 'ADMIN')
      ))
    )
  );


-- -----------------------------------------------------------------------------
-- 3/3 — Storage : bucket toolbox-documents + politiques RLS
-- -----------------------------------------------------------------------------
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
