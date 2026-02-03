-- QCM de certification : banque de questions par organisation, tentatives et notation
-- À exécuter dans Supabase (SQL Editor)

-- Colonnes supplémentaires sur certification_candidates pour l'examen
alter table public.certification_candidates
  add column if not exists exam_started_at timestamptz,
  add column if not exists exam_submitted_at timestamptz,
  add column if not exists exam_score_pct numeric(5,2),
  add column if not exists exam_answers jsonb default '[]';

-- Banque de questions d'examen (par organisation)
create table if not exists public.exam_questions (
  id uuid primary key default gen_random_uuid(),
  organisation_id text not null references public.organisations(id) on delete cascade,
  question_text text not null,
  sort_order int not null default 0,
  created_at timestamptz default now()
);

create index if not exists idx_exam_questions_org on public.exam_questions (organisation_id);

-- Réponses possibles (une seule correcte par question)
create table if not exists public.exam_question_choices (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.exam_questions(id) on delete cascade,
  choice_text text not null,
  is_correct boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz default now()
);

create index if not exists idx_exam_question_choices_question on public.exam_question_choices (question_id);

-- RLS
alter table public.exam_questions enable row level security;
alter table public.exam_question_choices enable row level security;

-- Certificateur et Admin Org : gestion des questions de leur org
create policy exam_questions_select_certificateur
  on public.exam_questions for select
  using (
    auth.role() = 'app_certificateur'
    or (auth.role() = 'app_admin_org' and organisation_id in (select organisation_id from public.staff_users where auth_user_id = auth.uid()))
  );

create policy exam_questions_all_certificateur
  on public.exam_questions for all
  using (auth.role() = 'app_certificateur')
  with check (auth.role() = 'app_certificateur');

create policy exam_questions_admin_org
  on public.exam_questions for all
  using (auth.role() = 'app_admin_org' and organisation_id in (select organisation_id from public.staff_users where auth_user_id = auth.uid()))
  with check (auth.role() = 'app_admin_org' and organisation_id in (select organisation_id from public.staff_users where auth_user_id = auth.uid()));

-- Incubé : lecture des questions et choix pour passer l'examen (organisation = la sienne)
create policy exam_questions_select_incube
  on public.exam_questions for select
  using (
    organisation_id in (select organisation_id from public.incubes where auth_user_id = auth.uid())
  );

create policy exam_question_choices_select
  on public.exam_question_choices for select
  using (
    exists (
      select 1 from public.exam_questions eq
      where eq.id = question_id
      and (auth.role() in ('app_certificateur', 'app_admin_org', 'app_super_admin')
           or eq.organisation_id in (select organisation_id from public.incubes where auth_user_id = auth.uid()))
    )
  );

create policy exam_question_choices_modify
  on public.exam_question_choices for all
  using (
    auth.role() = 'app_certificateur'
    or (auth.role() = 'app_admin_org' and exists (
      select 1 from public.exam_questions eq
      join public.staff_users s on s.organisation_id = eq.organisation_id and s.auth_user_id = auth.uid()
      where eq.id = question_id
    ))
  )
  with check (
    auth.role() = 'app_certificateur'
    or (auth.role() = 'app_admin_org' and exists (
      select 1 from public.exam_questions eq
      join public.staff_users s on s.organisation_id = eq.organisation_id and s.auth_user_id = auth.uid()
      where eq.id = question_id
    ))
  );

-- Super Admin : accès global
create policy exam_questions_super_admin on public.exam_questions for all using (auth.role() = 'app_super_admin') with check (auth.role() = 'app_super_admin');
create policy exam_question_choices_super_admin on public.exam_question_choices for all using (auth.role() = 'app_super_admin') with check (auth.role() = 'app_super_admin');

-- RPC : soumettre l'examen (réponses envoyées, notation côté serveur, mise à jour candidat)
create or replace function public.submit_certification_exam(
  p_candidate_id uuid,
  p_answers jsonb  -- [ { "question_id": "uuid", "choice_id": "uuid" }, ... ]
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_candidate record;
  v_question record;
  v_choice record;
  v_answer jsonb;
  v_correct int := 0;
  v_total int := 0;
  v_score_pct numeric(5,2);
  v_result text;
begin
  select * into v_candidate
  from certification_candidates
  where id = p_candidate_id
    and exam_status = 'IN_PROGRESS'
    and exam_result is null;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'Candidat invalide ou examen déjà soumis');
  end if;

  if auth.uid() is distinct from (select auth_user_id from incubes where id = v_candidate.incube_id) then
    return jsonb_build_object('ok', false, 'error', 'Non autorisé');
  end if;

  for v_answer in select * from jsonb_array_elements(p_answers)
  loop
    v_total := v_total + 1;
    select c.is_correct into v_choice
    from exam_question_choices c
    join exam_questions q on q.id = c.question_id
    where q.organisation_id = v_candidate.organisation_id
      and c.id = (v_answer->>'choice_id')::uuid;
    if found and v_choice.is_correct then
      v_correct := v_correct + 1;
    end if;
  end loop;

  if v_total = 0 then
    v_score_pct := 0;
  else
    v_score_pct := round((v_correct::numeric / v_total) * 100, 2);
  end if;

  v_result := case when v_score_pct >= 70 then 'CERTIFIED' else 'FAILED' end;

  update certification_candidates
  set exam_status = 'DONE',
      exam_result = v_result,
      exam_submitted_at = now(),
      exam_score_pct = v_score_pct,
      exam_answers = p_answers
  where id = p_candidate_id;

  update incubes
  set global_status = case when v_result = 'CERTIFIED' then 'CERTIFIED' else 'FAILED' end
  where id = v_candidate.incube_id;

  return jsonb_build_object('ok', true, 'score_pct', v_score_pct, 'result', v_result);
end;
$$;
