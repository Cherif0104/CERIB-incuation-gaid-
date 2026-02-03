-- Demandes de coaching (levée de main) : incubé → coach
-- À exécuter après le schéma principal

create table if not exists public.coaching_requests (
  id uuid primary key default gen_random_uuid(),
  incube_id uuid not null references public.incubes(id) on delete cascade,
  coach_id uuid not null references public.staff_users(id) on delete cascade,
  organisation_id text not null references public.organisations(id) on delete cascade,
  status text not null default 'PENDING' check (status in ('PENDING', 'ACCEPTED', 'DONE', 'CANCELLED')),
  message text,
  created_at timestamptz default now(),
  responded_at timestamptz
);

create index if not exists idx_coaching_requests_incube on public.coaching_requests (incube_id);
create index if not exists idx_coaching_requests_coach on public.coaching_requests (coach_id);
alter table public.coaching_requests enable row level security;

-- RLS : incubé voit ses demandes, coach voit les demandes qui lui sont adressées
create policy if not exists incube_coaching_requests_own
  on public.coaching_requests for all
  to authenticated
  using (
    incube_id in (select id from public.incubes where auth_user_id = auth.uid())
  )
  with check (
    incube_id in (select id from public.incubes where auth_user_id = auth.uid())
  );

create policy if not exists coach_coaching_requests_incoming
  on public.coaching_requests for select
  to authenticated
  using (
    coach_id in (select id from public.staff_users where auth_user_id = auth.uid())
  );

-- Coach peut mettre à jour (accepter, marquer fait)
create policy if not exists coach_coaching_requests_update
  on public.coaching_requests for update
  to authenticated
  using (
    coach_id in (select id from public.staff_users where auth_user_id = auth.uid())
  );
