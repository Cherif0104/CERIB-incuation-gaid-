-- Parcours 2 : Programmes, Projets, Tâches
-- À exécuter dans Supabase (SQL Editor) après le schéma de base et les politiques RLS existantes.

-- 1. Table programmes (par organisation)
create table if not exists public.programmes (
  id uuid primary key default gen_random_uuid(),
  organisation_id text not null references public.organisations(id) on delete cascade,
  name text not null,
  funder text,
  start_date date,
  end_date date,
  budget numeric(14, 2),
  created_at timestamptz default now()
);

create index if not exists idx_programmes_organisation on public.programmes (organisation_id);

-- 2. Table projets (par programme)
create table if not exists public.projets (
  id uuid primary key default gen_random_uuid(),
  programme_id uuid not null references public.programmes(id) on delete cascade,
  name text not null,
  objectives text,
  status text not null default 'PLANIFIED' check (status in ('PLANIFIED', 'IN_PROGRESS', 'COMPLETED')),
  start_date date,
  end_date date,
  created_at timestamptz default now()
);

create index if not exists idx_projets_programme on public.projets (programme_id);

-- 3. Table tâches (par projet)
create table if not exists public.programme_taches (
  id uuid primary key default gen_random_uuid(),
  projet_id uuid not null references public.projets(id) on delete cascade,
  title text not null,
  due_date date,
  status text not null default 'TODO' check (status in ('TODO', 'IN_PROGRESS', 'DONE')),
  sort_order int not null default 0,
  created_at timestamptz default now()
);

create index if not exists idx_programme_taches_projet on public.programme_taches (projet_id);

-- RLS
alter table public.programmes enable row level security;
alter table public.projets enable row level security;
alter table public.programme_taches enable row level security;

-- Super Admin : lecture seule sur tout
create policy programmes_select_super_admin
  on public.programmes for select
  using (auth.role() = 'app_super_admin');

create policy projets_select_super_admin
  on public.projets for select
  using (auth.role() = 'app_super_admin');

create policy programme_taches_select_super_admin
  on public.programme_taches for select
  using (auth.role() = 'app_super_admin');

-- Admin Org : tout (CRUD) sur les lignes de son organisation
create policy programmes_admin_org
  on public.programmes for all
  using (
    auth.role() = 'app_admin_org'
    and organisation_id in (select organisation_id from public.staff_users where auth_user_id = auth.uid())
  )
  with check (
    auth.role() = 'app_admin_org'
    and organisation_id in (select organisation_id from public.staff_users where auth_user_id = auth.uid())
  );

create policy projets_admin_org
  on public.projets for all
  using (
    auth.role() = 'app_admin_org'
    and programme_id in (
      select id from public.programmes
      where organisation_id in (select organisation_id from public.staff_users where auth_user_id = auth.uid())
    )
  )
  with check (
    auth.role() = 'app_admin_org'
    and programme_id in (
      select id from public.programmes
      where organisation_id in (select organisation_id from public.staff_users where auth_user_id = auth.uid())
    )
  );

create policy programme_taches_admin_org
  on public.programme_taches for all
  using (
    auth.role() = 'app_admin_org'
    and projet_id in (
      select p.id from public.projets p
      join public.programmes prog on prog.id = p.programme_id
      where prog.organisation_id in (select organisation_id from public.staff_users where auth_user_id = auth.uid())
    )
  )
  with check (
    auth.role() = 'app_admin_org'
    and projet_id in (
      select p.id from public.projets p
      join public.programmes prog on prog.id = p.programme_id
      where prog.organisation_id in (select organisation_id from public.staff_users where auth_user_id = auth.uid())
    )
  );
