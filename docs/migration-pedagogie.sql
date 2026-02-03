-- Contenus pédagogiques : modules de formation P1/P2, progression incubés
-- À exécuter dans Supabase (SQL Editor)

-- Modules (vidéo, quiz, texte) par phase de parcours
create table if not exists public.learning_modules (
  id uuid primary key default gen_random_uuid(),
  organisation_id text references public.organisations(id) on delete cascade,
  parcours_phase text not null check (parcours_phase in ('P1', 'P2')),
  title text not null,
  description text,
  sort_order int not null default 0,
  type text not null check (type in ('video', 'quiz', 'text')),
  payload jsonb default '{}',
  created_at timestamptz default now()
);

create index if not exists idx_learning_modules_org_phase on public.learning_modules (organisation_id, parcours_phase);

-- Questions de quiz rattachées à un module de type quiz
create table if not exists public.module_quiz_questions (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.learning_modules(id) on delete cascade,
  question_text text not null,
  sort_order int not null default 0,
  created_at timestamptz default now()
);

create index if not exists idx_module_quiz_questions_module on public.module_quiz_questions (module_id);

-- Réponses possibles (une seule correcte par question)
create table if not exists public.module_quiz_choices (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.module_quiz_questions(id) on delete cascade,
  choice_text text not null,
  is_correct boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz default now()
);

create index if not exists idx_module_quiz_choices_question on public.module_quiz_choices (question_id);

-- Progression : quel incubé a complété quel module (et score si quiz)
create table if not exists public.incube_module_progress (
  id uuid primary key default gen_random_uuid(),
  incube_id uuid not null references public.incubes(id) on delete cascade,
  module_id uuid not null references public.learning_modules(id) on delete cascade,
  completed_at timestamptz default now(),
  score_pct numeric(5,2),
  created_at timestamptz default now(),
  unique (incube_id, module_id)
);

create index if not exists idx_incube_module_progress_incube on public.incube_module_progress (incube_id);
create index if not exists idx_incube_module_progress_module on public.incube_module_progress (module_id);

-- RLS
alter table public.learning_modules enable row level security;
alter table public.module_quiz_questions enable row level security;
alter table public.module_quiz_choices enable row level security;
alter table public.incube_module_progress enable row level security;

-- Lecture modules : selon org ou global (organisation_id null)
create policy learning_modules_select_org
  on public.learning_modules for select
  using (
    organisation_id is null
    or organisation_id in (select organisation_id from public.staff_users where auth_user_id = auth.uid())
    or organisation_id in (select organisation_id from public.incubes where auth_user_id = auth.uid())
  );

create policy learning_modules_all_super_admin
  on public.learning_modules for all
  using (auth.role() = 'app_super_admin')
  with check (auth.role() = 'app_super_admin');

-- Questions/choix : lecture si on peut lire le module
create policy module_quiz_questions_select
  on public.module_quiz_questions for select
  using (
    exists (
      select 1 from public.learning_modules m
      where m.id = module_id
      and (m.organisation_id is null or m.organisation_id in (
        select organisation_id from public.staff_users where auth_user_id = auth.uid()
      ) or m.organisation_id in (select organisation_id from public.incubes where auth_user_id = auth.uid()))
    )
  );

create policy module_quiz_choices_select
  on public.module_quiz_choices for select
  using (
    exists (
      select 1 from public.module_quiz_questions q
      join public.learning_modules m on m.id = q.module_id
      where q.id = question_id
      and (m.organisation_id is null or m.organisation_id in (
        select organisation_id from public.staff_users where auth_user_id = auth.uid()
      ) or m.organisation_id in (select organisation_id from public.incubes where auth_user_id = auth.uid()))
    )
  );

-- Progression : incubé lit/écrit sa propre progression ; coach/admin lisent
create policy incube_module_progress_select_incube
  on public.incube_module_progress for select
  using (
    incube_id in (select id from public.incubes where auth_user_id = auth.uid())
    or incube_id in (
      select incube_id from public.assignations a
      join public.staff_users s on s.id = a.coach_id
      where s.auth_user_id = auth.uid()
    )
  );

create policy incube_module_progress_insert_incube
  on public.incube_module_progress for insert
  with check (
    incube_id in (select id from public.incubes where auth_user_id = auth.uid())
  );

create policy incube_module_progress_update_incube
  on public.incube_module_progress for update
  using (incube_id in (select id from public.incubes where auth_user_id = auth.uid()));

-- Admin org peut tout gérer sur les modules de son org
create policy learning_modules_admin_org
  on public.learning_modules for all
  using (
    auth.role() = 'app_admin_org'
    and (organisation_id is null or organisation_id in (select organisation_id from public.staff_users where auth_user_id = auth.uid()))
  )
  with check (
    auth.role() = 'app_admin_org'
    and (organisation_id is null or organisation_id in (select organisation_id from public.staff_users where auth_user_id = auth.uid()))
  );

create policy module_quiz_questions_admin_org
  on public.module_quiz_questions for all
  using (
    auth.role() = 'app_admin_org'
    and exists (select 1 from public.learning_modules m where m.id = module_id and m.organisation_id in (select organisation_id from public.staff_users where auth_user_id = auth.uid()))
  )
  with check (
    auth.role() = 'app_admin_org'
    and exists (select 1 from public.learning_modules m where m.id = module_id and m.organisation_id in (select organisation_id from public.staff_users where auth_user_id = auth.uid()))
  );

create policy module_quiz_choices_admin_org
  on public.module_quiz_choices for all
  using (
    auth.role() = 'app_admin_org'
    and exists (
      select 1 from public.module_quiz_questions q
      join public.learning_modules m on m.id = q.module_id
      where q.id = question_id and m.organisation_id in (select organisation_id from public.staff_users where auth_user_id = auth.uid())
    )
  )
  with check (
    auth.role() = 'app_admin_org'
    and exists (
      select 1 from public.module_quiz_questions q
      join public.learning_modules m on m.id = q.module_id
      where q.id = question_id and m.organisation_id in (select organisation_id from public.staff_users where auth_user_id = auth.uid())
    )
  );

-- Recalcul des scores P1/P2 à partir de la progression (moyenne des quiz par phase)
create or replace function public.recompute_incube_scores_from_progress()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_incube_id uuid := coalesce(new.incube_id, old.incube_id);
  v_p1_avg numeric;
  v_p2_avg numeric;
begin
  select avg(p.score_pct) into v_p1_avg
  from incube_module_progress p
  join learning_modules m on m.id = p.module_id and m.type = 'quiz'
  where p.incube_id = v_incube_id and m.parcours_phase = 'P1' and p.score_pct is not null;
  select avg(p.score_pct) into v_p2_avg
  from incube_module_progress p
  join learning_modules m on m.id = p.module_id and m.type = 'quiz'
  where p.incube_id = v_incube_id and m.parcours_phase = 'P2' and p.score_pct is not null;

  update incubes
  set p1_score = round(v_p1_avg, 2),
      p2_score = round(v_p2_avg, 2)
  where id = v_incube_id;
  return coalesce(new, old);
end;
$$;

drop trigger if exists trigger_recompute_scores on public.incube_module_progress;
create trigger trigger_recompute_scores
  after insert or update of score_pct on public.incube_module_progress
  for each row
  execute function public.recompute_incube_scores_from_progress();
