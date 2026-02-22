-- À exécuter en premier dans l'éditeur SQL Supabase si la connexion renvoie 500
-- sur staff_users et incubes et ramène à la page de login.
-- (CREATE POLICY IF NOT EXISTS n'existe pas en PostgreSQL, les politiques de lecture du profil
--  n'ont peut-être jamais été créées.)

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
