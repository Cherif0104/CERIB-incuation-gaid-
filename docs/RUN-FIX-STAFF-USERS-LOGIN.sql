-- À exécuter dans l'éditeur SQL Supabase.
-- Sans cette politique, la requête GET staff_users?auth_user_id=eq.<uid> renvoie 500
-- et les comptes staff (Super Admin, Admin Org, Coach, Certificateur) ne peuvent pas se connecter.

drop policy if exists staff_users_select_own on public.staff_users;
create policy staff_users_select_own
  on public.staff_users
  for select
  to authenticated
  using (auth_user_id = auth.uid());
