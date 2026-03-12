-- RPC start_certification_exam : permet à un incubé validé (COACH_VALIDATED) de lancer l'examen
-- si une session OPEN est dans la fenêtre start_at..end_at pour son organisation.
-- À exécuter dans Supabase (SQL Editor) ou via scripts/run-migrations.mjs

-- Incubés : lecture des sessions de leur organisation (pour afficher le bouton "Lancer l'examen")
create policy cert_sessions_incube_select
  on public.certification_sessions for select
  to authenticated
  using (
    organisation_id in (select organisation_id from public.incubes where auth_user_id = auth.uid())
  );

create or replace function public.start_certification_exam()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_incube_id uuid;
  v_org_id text;
  v_candidate record;
  v_session record;
begin
  select id, organisation_id into v_incube_id, v_org_id
  from incubes where auth_user_id = auth.uid();
  if not found then
    return jsonb_build_object('ok', false, 'error', 'Incubé non trouvé');
  end if;

  if (select global_status from incubes where id = v_incube_id) <> 'COACH_VALIDATED' then
    return jsonb_build_object('ok', false, 'error', 'Clé 1 non validée');
  end if;

  select * into v_candidate from certification_candidates
  where incube_id = v_incube_id and coach_validation_at is not null
    and exam_status = 'PENDING' and exam_result is null
  limit 1;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'Aucun candidat en attente');
  end if;

  select * into v_session from certification_sessions
  where organisation_id = v_org_id and status = 'OPEN'
    and start_at <= now() and end_at >= now()
  limit 1;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'Aucune session ouverte dans la fenêtre actuelle');
  end if;

  update certification_candidates
  set session_id = v_session.id, exam_status = 'IN_PROGRESS', exam_started_at = now()
  where id = v_candidate.id;

  update incubes set global_status = 'EXAM_IN_PROGRESS' where id = v_incube_id;

  return jsonb_build_object('ok', true, 'candidate_id', v_candidate.id);
end;
$$;
