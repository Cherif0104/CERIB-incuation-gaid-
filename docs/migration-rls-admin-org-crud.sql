-- RLS : permettre à l'Admin Org de modifier/supprimer les entités de son organisation
-- (promotions, assignations, codes d'invitation). Utilise staff_users, pas auth.role().

-- Promotions : Admin Org tout (SELECT, INSERT, UPDATE, DELETE) sur les promotions de son org
drop policy if exists admin_org_promotions_all on public.promotions;
create policy admin_org_promotions_all
  on public.promotions for all
  to authenticated
  using (
    organisation_id in (
      select organisation_id from public.staff_users
      where auth_user_id = auth.uid() and role in ('ADMIN_ORG', 'ADMIN')
    )
  )
  with check (
    organisation_id in (
      select organisation_id from public.staff_users
      where auth_user_id = auth.uid() and role in ('ADMIN_ORG', 'ADMIN')
    )
  );

-- Assignations : Admin Org tout sur les assignations de son org
drop policy if exists admin_org_assignations_all on public.assignations;
create policy admin_org_assignations_all
  on public.assignations for all
  to authenticated
  using (
    organisation_id in (
      select organisation_id from public.staff_users
      where auth_user_id = auth.uid() and role in ('ADMIN_ORG', 'ADMIN')
    )
  )
  with check (
    organisation_id in (
      select organisation_id from public.staff_users
      where auth_user_id = auth.uid() and role in ('ADMIN_ORG', 'ADMIN')
    )
  );

-- Invitation codes : Admin Org peut mettre à jour et supprimer les codes de son org
drop policy if exists admin_org_invitation_codes_update on public.invitation_codes;
create policy admin_org_invitation_codes_update
  on public.invitation_codes for update
  to authenticated
  using (
    organisation_id in (
      select organisation_id from public.staff_users su
      where su.auth_user_id = auth.uid() and su.role in ('ADMIN_ORG', 'ADMIN')
    )
  )
  with check (
    organisation_id in (
      select organisation_id from public.staff_users su
      where su.auth_user_id = auth.uid() and su.role in ('ADMIN_ORG', 'ADMIN')
    )
  );

drop policy if exists admin_org_invitation_codes_delete on public.invitation_codes;
create policy admin_org_invitation_codes_delete
  on public.invitation_codes for delete
  to authenticated
  using (
    organisation_id in (
      select organisation_id from public.staff_users su
      where su.auth_user_id = auth.uid() and su.role in ('ADMIN_ORG', 'ADMIN')
    )
  );

-- Certification sessions : Certificateur et Admin Org peuvent tout faire sur les sessions de leur org
drop policy if exists cert_sessions_certificateur_admin_org_all on public.certification_sessions;
create policy cert_sessions_certificateur_admin_org_all
  on public.certification_sessions for all
  to authenticated
  using (
    organisation_id in (
      select organisation_id from public.staff_users
      where auth_user_id = auth.uid() and role in ('CERTIFICATEUR', 'ADMIN_ORG', 'ADMIN')
    )
  )
  with check (
    organisation_id in (
      select organisation_id from public.staff_users
      where auth_user_id = auth.uid() and role in ('CERTIFICATEUR', 'ADMIN_ORG', 'ADMIN')
    )
  );
