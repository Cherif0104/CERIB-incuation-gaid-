-- Schéma SQL initial pour Supabase (Postgres)
-- À exécuter dans le projet Supabase mfxskmfwongxxuqiubcz

-- 1. ORGANISATIONS
create table if not exists public.organisations (
  id text primary key,
  name text not null,
  account_type text not null,
  main_admin_user_id uuid, -- référence à auth.users.id ou staff_users.id selon choix
  quota_incubes integer default 0,
  quota_coachs integer default 0,
  is_suspended boolean default false,
  created_at timestamptz default now()
);

-- 2. STAFF_USERS (Super Admin, Admin Org, Coach, Certificateur)
create table if not exists public.staff_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  role text not null check (role in ('SUPER_ADMIN', 'ADMIN_ORG', 'COACH', 'CERTIFICATEUR')),
  organisation_id text references public.organisations(id),
  visibility_scope jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_staff_users_org on public.staff_users (organisation_id);

-- 3. PROMOTIONS
create table if not exists public.promotions (
  id text primary key,
  name text not null,
  organisation_id text not null references public.organisations(id) on delete cascade,
  parcours_type text not null check (parcours_type in ('P1', 'P2', 'MIXTE')),
  start_mode text not null check (start_mode in ('P1', 'P2')),
  end_rule text,
  created_at timestamptz default now()
);

create index if not exists idx_promotions_org on public.promotions (organisation_id);

-- 4. INCUBES
create table if not exists public.incubes (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  organisation_id text not null references public.organisations(id) on delete cascade,
  current_parcours text not null check (current_parcours in ('P1', 'P2')),
  p1_score numeric(5,2),
  p2_score numeric(5,2),
  global_status text not null default 'P1_EN_COURS' check (
    global_status in (
      'P1_EN_COURS',
      'P2_EN_COURS',
      'READY_FOR_REVIEW',
      'COACH_VALIDATED',
      'SESSION_SCHEDULED',
      'EXAM_IN_PROGRESS',
      'CERTIFIED',
      'FAILED'
    )
  ),
  created_at timestamptz default now()
);

create index if not exists idx_incubes_org on public.incubes (organisation_id);

-- 5. ASSIGNATIONS
create table if not exists public.assignations (
  id uuid primary key default gen_random_uuid(),
  organisation_id text not null references public.organisations(id) on delete cascade,
  incube_id uuid not null references public.incubes(id) on delete cascade,
  coach_id uuid not null references public.staff_users(id) on delete cascade,
  promotion_id text not null references public.promotions(id) on delete cascade,
  created_at timestamptz default now(),
  unique (incube_id, promotion_id)
);

create index if not exists idx_assignations_org on public.assignations (organisation_id);
create index if not exists idx_assignations_coach on public.assignations (coach_id);

-- 6. CERTIFICATION_SESSIONS
create table if not exists public.certification_sessions (
  id uuid primary key default gen_random_uuid(),
  organisation_id text not null references public.organisations(id) on delete cascade,
  name text,
  start_at timestamptz not null,
  end_at timestamptz not null,
  status text not null default 'SCHEDULED' check (status in ('SCHEDULED', 'OPEN', 'CLOSED')),
  created_at timestamptz default now()
);

create index if not exists idx_cert_sessions_org on public.certification_sessions (organisation_id);

-- 7. CERTIFICATION_CANDIDATES
create table if not exists public.certification_candidates (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.certification_sessions(id) on delete set null,
  incube_id uuid not null references public.incubes(id) on delete cascade,
  organisation_id text not null references public.organisations(id) on delete cascade,
  coach_id uuid not null references public.staff_users(id) on delete cascade,
  coach_validation_at timestamptz,
  certificateur_validation_at timestamptz,
  exam_status text not null default 'PENDING' check (exam_status in ('PENDING', 'IN_PROGRESS', 'DONE')),
  exam_result text check (exam_result in ('CERTIFIED', 'FAILED')),
  created_at timestamptz default now()
);

create index if not exists idx_cert_candidates_org on public.certification_candidates (organisation_id);
create index if not exists idx_cert_candidates_session on public.certification_candidates (session_id);

-- =====================================================================
-- RLS (Row Level Security) - politiques de base
-- =====================================================================

-- Activer RLS
alter table public.organisations enable row level security;
alter table public.staff_users enable row level security;
alter table public.promotions enable row level security;
alter table public.incubes enable row level security;
alter table public.assignations enable row level security;
alter table public.certification_sessions enable row level security;
alter table public.certification_candidates enable row level security;

-- Exemple de rôles applicatifs à mapper côté Supabase:
--   app_super_admin, app_admin_org, app_coach, app_certificateur, app_incube

-- 1) Super Admin : accès global (via rôle technique app_super_admin)
create policy if not exists super_admin_all_organisations
  on public.organisations
  for all
  using (auth.role() = 'app_super_admin')
  with check (auth.role() = 'app_super_admin');

create policy if not exists super_admin_all_staff
  on public.staff_users
  for all
  using (auth.role() = 'app_super_admin')
  with check (auth.role() = 'app_super_admin');

-- 2) Admin Org : accès restreint à son organisation
create policy if not exists admin_org_organisations_select
  on public.organisations
  for select
  using (
    auth.role() = 'app_admin_org'
    and id in (select organisation_id from public.staff_users where auth_user_id = auth.uid())
  );

create policy if not exists admin_org_staff_org
  on public.staff_users
  for all
  using (
    auth.role() = 'app_admin_org'
    and organisation_id in (
      select organisation_id from public.staff_users where auth_user_id = auth.uid()
    )
  )
  with check (
    auth.role() = 'app_admin_org'
    and organisation_id in (
      select organisation_id from public.staff_users where auth_user_id = auth.uid()
    )
  );

-- 3) Coach : accès à ses assignations et incubes liés
create policy if not exists coach_assignations
  on public.assignations
  for select
  using (
    auth.role() = 'app_coach'
    and coach_id in (select id from public.staff_users where auth_user_id = auth.uid())
  );

create policy if not exists coach_incubes
  on public.incubes
  for select
  using (
    auth.role() = 'app_coach'
    and id in (
      select incube_id
      from public.assignations
      where coach_id in (select id from public.staff_users where auth_user_id = auth.uid())
    )
  );

-- 4) Certificateur : vue transversale sur les candidats de certification
create policy if not exists certificateur_candidates
  on public.certification_candidates
  for select
  using (auth.role() = 'app_certificateur');

-- 5) Incubé : accès uniquement à ses propres données
create policy if not exists incube_self
  on public.incubes
  for select
  using (
    auth.role() = 'app_incube'
    and auth_user_id = auth.uid()
  );

