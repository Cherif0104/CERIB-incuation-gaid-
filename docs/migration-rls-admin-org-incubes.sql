-- Admin Org : lecture des incubés de son organisation (pour la page Incubés / avancement).

create policy if not exists admin_org_incubes_select
  on public.incubes
  for select
  using (
    exists (
      select 1 from public.staff_users s
      where s.auth_user_id = auth.uid()
        and s.role = 'ADMIN_ORG'
        and s.organisation_id = incubes.organisation_id
    )
  );

-- Admin Org : lecture de la progression modules des incubés de son organisation (pour colonne "Modules complétés").
create policy if not exists admin_org_incube_module_progress_select
  on public.incube_module_progress
  for select
  using (
    incube_id in (
      select i.id from public.incubes i
      join public.staff_users s on s.organisation_id = i.organisation_id and s.auth_user_id = auth.uid() and s.role = 'ADMIN_ORG'
    )
  );
