-- ============================================================
-- CORRECTIF : Connexion incubé — rester sur la page login
-- ============================================================
-- À exécuter dans Supabase Dashboard → SQL Editor
-- Sans ces politiques, un incubé connecté ne peut pas lire son
-- propre profil (RLS bloque), donc l'app ne charge pas le dashboard.
-- ============================================================

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
