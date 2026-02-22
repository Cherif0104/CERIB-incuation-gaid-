-- Super Admin : lecture de toutes les demandes de coaching (DEMANDES & ALERTES)
alter table public.coaching_requests enable row level security;

create policy if not exists super_admin_coaching_requests_select
  on public.coaching_requests for select
  to authenticated
  using (
    exists (select 1 from public.staff_users where auth_user_id = auth.uid() and role = 'SUPER_ADMIN')
  );
