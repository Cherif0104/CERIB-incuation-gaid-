-- RDV / Convocations : extension coaching_requests + table messages (messagerie & SOS)

-- Extension coaching_requests pour RDV
alter table public.coaching_requests
  add column if not exists objectif text,
  add column if not exists travail_preparatoire text,
  add column if not exists scheduled_at timestamptz,
  add column if not exists platform text,
  add column if not exists meeting_link text,
  add column if not exists is_urgence boolean default false,
  add column if not exists mois_num smallint,
  add column if not exists request_type text default 'COACHING' check (request_type in ('COACHING', 'RDV', 'SOS_URGENCE'));

-- Table messages (échanges coach <-> incubé)
create table if not exists public.coach_incube_messages (
  id uuid primary key default gen_random_uuid(),
  incube_id uuid not null references public.incubes(id) on delete cascade,
  coach_id uuid not null references public.staff_users(id) on delete cascade,
  body text not null,
  is_urgence boolean default false,
  from_incube boolean not null default true,
  created_at timestamptz default now()
);

create index if not exists idx_coach_incube_messages_incube on public.coach_incube_messages (incube_id);
create index if not exists idx_coach_incube_messages_coach on public.coach_incube_messages (coach_id);
alter table public.coach_incube_messages enable row level security;

create policy coach_incube_messages_incube
  on public.coach_incube_messages for all
  using (incube_id in (select id from public.incubes where auth_user_id = auth.uid()))
  with check (incube_id in (select id from public.incubes where auth_user_id = auth.uid()) and from_incube = true);

create policy coach_incube_messages_coach
  on public.coach_incube_messages for all
  using (coach_id in (select id from public.staff_users where auth_user_id = auth.uid()))
  with check (coach_id in (select id from public.staff_users where auth_user_id = auth.uid()) and from_incube = false);
