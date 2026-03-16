-- Correction RLS : le coach doit voir ses assignations et incubés.
-- La politique coach_assignations utilisait auth.role() = 'app_coach' qui ne correspond jamais
-- (Supabase utilise 'authenticated' pour les utilisateurs connectés).
-- On identifie les coachs via staff_users où role = 'COACH' et auth_user_id = auth.uid().

drop policy if exists coach_assignations on public.assignations;
create policy coach_assignations
  on public.assignations
  for select
  using (
    coach_id in (select id from public.staff_users where auth_user_id = auth.uid() and role = 'COACH')
  );

drop policy if exists coach_incubes on public.incubes;
create policy coach_incubes
  on public.incubes
  for select
  using (
    id in (
      select incube_id
      from public.assignations
      where coach_id in (select id from public.staff_users where auth_user_id = auth.uid() and role = 'COACH')
    )
  );
