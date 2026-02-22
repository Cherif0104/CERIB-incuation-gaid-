-- Paramètres incubé (Coach/Admin) + validation par mois
-- Vision client MVP : Temps (h), Sessions, Max SOS, Max RDV ; validation "mois" par le coach

-- Colonnes sur incubes
alter table public.incubes
  add column if not exists temps_h integer default 4,
  add column if not exists sessions integer default 2,
  add column if not exists max_sos integer default 1,
  add column if not exists max_rdv integer default 1;

-- Validation d'un mois par le coach (Mois 1 à 4)
create table if not exists public.incube_mois_validation (
  id uuid primary key default gen_random_uuid(),
  incube_id uuid not null references public.incubes(id) on delete cascade,
  mois_num smallint not null check (mois_num >= 1 and mois_num <= 4),
  validated_at timestamptz not null default now(),
  coach_id uuid not null references public.staff_users(id) on delete cascade,
  comment text,
  unique (incube_id, mois_num)
);

create index if not exists idx_incube_mois_validation_incube on public.incube_mois_validation (incube_id);
create index if not exists idx_incube_mois_validation_coach on public.incube_mois_validation (coach_id);
alter table public.incube_mois_validation enable row level security;

create policy incube_mois_validation_incube_select
  on public.incube_mois_validation for select
  using (incube_id in (select id from public.incubes where auth_user_id = auth.uid()));

create policy incube_mois_validation_coach_all
  on public.incube_mois_validation for all
  using (coach_id in (select id from public.staff_users where auth_user_id = auth.uid()))
  with check (coach_id in (select id from public.staff_users where auth_user_id = auth.uid()));

create policy incube_mois_validation_admin_org
  on public.incube_mois_validation for all
  using (
    exists (
      select 1 from public.incubes i
      join public.staff_users s on s.organisation_id = i.organisation_id and s.auth_user_id = auth.uid()
      where i.id = incube_id
    )
  );
