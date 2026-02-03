-- RLS : permettre à tout utilisateur connecté de lire sa propre ligne (profil)
-- pour que l'app puisse charger le rôle et rediriger vers le bon dashboard.
-- Sans cela, le JWT Supabase a role = 'authenticated', pas 'app_admin_org' etc.,
-- donc les politiques existantes bloquent la lecture du profil.

-- Lecture de sa propre ligne dans staff_users (pour tout auth_user_id = auth.uid())
create policy if not exists staff_users_select_own
  on public.staff_users
  for select
  using (auth_user_id = auth.uid());

-- Lecture de sa propre ligne dans incubes
create policy if not exists incubes_select_own
  on public.incubes
  for select
  using (auth_user_id = auth.uid());
