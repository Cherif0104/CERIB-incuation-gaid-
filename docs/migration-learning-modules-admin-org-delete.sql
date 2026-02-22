-- Permettre à l'admin org de supprimer/modifier les modules de son organisation
-- sans dépendre de auth.role() = 'app_admin_org' (souvent non défini dans le JWT Supabase).
-- On s'appuie uniquement sur staff_users (auth_user_id = auth.uid() et role ADMIN_ORG/ADMIN).

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
