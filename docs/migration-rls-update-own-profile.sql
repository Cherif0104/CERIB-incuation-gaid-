-- Permettre à chaque utilisateur de mettre à jour sa propre ligne (full_name, etc.)
-- Nécessaire pour la page Profil / Paramètres.

create policy if not exists staff_users_update_own
  on public.staff_users
  for update
  using (auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid());

create policy if not exists incubes_update_own
  on public.incubes
  for update
  using (auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid());
