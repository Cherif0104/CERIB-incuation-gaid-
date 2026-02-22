-- RLS : permettre au Super Admin (identifié via staff_users.role = 'SUPER_ADMIN')
-- de créer, lire, modifier et supprimer les organisations et de gérer staff_users.
-- Sans cette migration, auth.role() vaut 'authenticated' dans le JWT Supabase,
-- donc la politique super_admin_all_organisations (auth.role() = 'app_super_admin') ne passe jamais
-- et la création d'organisation depuis le dashboard Super Admin échoue (non persistante).

-- Organisations : tout pour le Super Admin via staff_users
drop policy if exists super_admin_organisations_via_staff on public.organisations;
create policy super_admin_organisations_via_staff
  on public.organisations
  for all
  to authenticated
  using (
    exists (select 1 from public.staff_users where auth_user_id = auth.uid() and role = 'SUPER_ADMIN')
  )
  with check (
    exists (select 1 from public.staff_users where auth_user_id = auth.uid() and role = 'SUPER_ADMIN')
  );

-- Staff_users : tout pour le Super Admin (lecture globale, insert pour create-platform-user, etc.)
drop policy if exists super_admin_staff_via_staff on public.staff_users;
create policy super_admin_staff_via_staff
  on public.staff_users
  for all
  to authenticated
  using (
    exists (select 1 from public.staff_users s where s.auth_user_id = auth.uid() and s.role = 'SUPER_ADMIN')
  )
  with check (
    exists (select 1 from public.staff_users s where s.auth_user_id = auth.uid() and s.role = 'SUPER_ADMIN')
  );
