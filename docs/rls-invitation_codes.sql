-- RLS pour invitation_codes : Admin Org (lecture/création pour son org), Super Admin (tout)
-- À exécuter après migration-invitations.sql

-- Super Admin : tout voir et tout faire sur invitation_codes
create policy if not exists super_admin_invitation_codes_all
on public.invitation_codes
for all
to authenticated
using (
  exists (
    select 1 from public.staff_users su
    where su.auth_user_id = auth.uid() and su.role = 'SUPER_ADMIN'
  )
)
with check (
  exists (
    select 1 from public.staff_users su
    where su.auth_user_id = auth.uid() and su.role = 'SUPER_ADMIN'
  )
);

-- Admin Org : voir et créer les codes de son organisation uniquement
create policy if not exists admin_org_invitation_codes_select
on public.invitation_codes
for select
to authenticated
using (
  organisation_id in (
    select su.organisation_id from public.staff_users su
    where su.auth_user_id = auth.uid() and su.role = 'ADMIN_ORG'
  )
);

create policy if not exists admin_org_invitation_codes_insert
on public.invitation_codes
for insert
to authenticated
with check (
  organisation_id in (
    select su.organisation_id from public.staff_users su
    where su.auth_user_id = auth.uid() and su.role = 'ADMIN_ORG'
  )
);
