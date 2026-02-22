-- Boîte à outils : documents par organisation (téléchargeables par les incubés)

create table if not exists public.toolbox_documents (
  id uuid primary key default gen_random_uuid(),
  organisation_id text not null references public.organisations(id) on delete cascade,
  title text not null,
  type text, -- ex. 'word', 'excel', 'pdf'
  file_url text not null,
  sort_order int not null default 0,
  created_at timestamptz default now()
);

create index if not exists idx_toolbox_documents_org on public.toolbox_documents (organisation_id);
alter table public.toolbox_documents enable row level security;

create policy toolbox_documents_select_org
  on public.toolbox_documents for select
  using (
    organisation_id in (select organisation_id from public.incubes where auth_user_id = auth.uid())
    or organisation_id in (select organisation_id from public.staff_users where auth_user_id = auth.uid())
  );

create policy toolbox_documents_admin_org
  on public.toolbox_documents for all
  using (
    organisation_id in (select organisation_id from public.staff_users where auth_user_id = auth.uid() and role in ('ADMIN_ORG', 'ADMIN'))
  )
  with check (
    organisation_id in (select organisation_id from public.staff_users where auth_user_id = auth.uid() and role in ('ADMIN_ORG', 'ADMIN'))
  );

create policy toolbox_documents_super_admin
  on public.toolbox_documents for all
  using (auth.role() = 'app_super_admin')
  with check (auth.role() = 'app_super_admin');
