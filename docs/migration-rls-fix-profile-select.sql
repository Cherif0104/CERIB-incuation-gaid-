-- Correctif : politiques "lecture de sa propre ligne" pour staff_users et incubes
-- En PostgreSQL, CREATE POLICY IF NOT EXISTS n'existe pas, donc migration-rls-read-own-profile.sql
-- a pu échouer en prod. Sans ces politiques, les requêtes select sur staff_users/incubes
-- (chargement du profil après login) renvoient 500 et l'utilisateur est renvoyé sur la page de connexion.
-- On utilise DROP IF EXISTS puis CREATE pour garantir que les politiques existent.

drop policy if exists staff_users_select_own on public.staff_users;
create policy staff_users_select_own
  on public.staff_users
  for select
  to authenticated
  using (auth_user_id = auth.uid());

drop policy if exists incubes_select_own on public.incubes;
create policy incubes_select_own
  on public.incubes
  for select
  to authenticated
  using (auth_user_id = auth.uid());
