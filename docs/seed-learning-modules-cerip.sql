-- Modules de démo pour cerip-dakar (P1 : texte + quiz ; P2 : texte)
-- À exécuter après seed.sql (organisations et promotions existent)

-- Modules P1 et P2 pour cerip-dakar
insert into public.learning_modules (organisation_id, promotion_id, parcours_phase, title, description, sort_order, type, payload, mois)
select 'cerip-dakar', 'promo-2025-1', 'P1', 'Bienvenue en P1', 'Introduction au parcours premier niveau.', 1, 'text', '{"body":"Bienvenue dans le parcours Savana. Ce module vous présente les fondamentaux."}'::jsonb, 1
where not exists (select 1 from public.learning_modules where organisation_id = 'cerip-dakar' and parcours_phase = 'P1' and sort_order = 1);

insert into public.learning_modules (organisation_id, promotion_id, parcours_phase, title, description, sort_order, type, payload, mois)
select 'cerip-dakar', 'promo-2025-1', 'P1', 'Quiz P1 – Fondamentaux', 'QCM de validation des acquis P1.', 2, 'quiz', '{}'::jsonb, 1
where not exists (select 1 from public.learning_modules where organisation_id = 'cerip-dakar' and parcours_phase = 'P1' and sort_order = 2);

insert into public.learning_modules (organisation_id, promotion_id, parcours_phase, title, description, sort_order, type, payload, mois)
select 'cerip-dakar', 'promo-2025-1', 'P2', 'Module P2 – Approfondissement', 'Contenu avancé pour la phase 2.', 1, 'text', '{"body":"Phase 2 : approfondissez vos connaissances."}'::jsonb, 1
where not exists (select 1 from public.learning_modules where organisation_id = 'cerip-dakar' and parcours_phase = 'P2' and sort_order = 1);

-- Questions pour le quiz P1
do $$
declare
  mid uuid;
  q1 uuid;
  q2 uuid;
begin
  select id into mid from public.learning_modules where organisation_id = 'cerip-dakar' and type = 'quiz' and parcours_phase = 'P1' limit 1;
  if mid is null then return; end if;
  if exists (select 1 from public.module_quiz_questions where module_id = mid) then return; end if;
  insert into public.module_quiz_questions (module_id, question_text, sort_order) values (mid, 'Question 1 : Quelle est la première étape du parcours ?', 1) returning id into q1;
  insert into public.module_quiz_questions (module_id, question_text, sort_order) values (mid, 'Question 2 : Que signifie CERIP ?', 2) returning id into q2;
  insert into public.module_quiz_choices (question_id, choice_text, is_correct, sort_order) values (q1, 'Commencer par le module Bienvenue', true, 1), (q1, 'Passer directement au quiz', false, 2);
  insert into public.module_quiz_choices (question_id, choice_text, is_correct, sort_order) values (q2, 'Centre d''Études', false, 1), (q2, 'Centre d''Études et de Recherches pour l''Innovation et le Partenariat', true, 2);
end $$;

-- Questions d'examen de certification (QCM) pour cerip-dakar
insert into public.exam_questions (organisation_id, question_text, sort_order)
select 'cerip-dakar', 'Question examen 1 : Quel est l''objectif principal du parcours CERIP ?', 1
where not exists (select 1 from public.exam_questions where organisation_id = 'cerip-dakar' and sort_order = 1);

insert into public.exam_questions (organisation_id, question_text, sort_order)
select 'cerip-dakar', 'Question examen 2 : Quelle phase suit P1 dans le parcours ?', 2
where not exists (select 1 from public.exam_questions where organisation_id = 'cerip-dakar' and sort_order = 2);

do $$
declare
  eq1 uuid;
  eq2 uuid;
begin
  select id into eq1 from public.exam_questions where organisation_id = 'cerip-dakar' and sort_order = 1 limit 1;
  select id into eq2 from public.exam_questions where organisation_id = 'cerip-dakar' and sort_order = 2 limit 1;
  if eq1 is not null and not exists (select 1 from public.exam_question_choices where question_id = eq1) then
    insert into public.exam_question_choices (question_id, choice_text, is_correct, sort_order) values
      (eq1, 'Accompagner l''innovation et le partenariat', true, 1),
      (eq1, 'Former uniquement des techniciens', false, 2);
  end if;
  if eq2 is not null and not exists (select 1 from public.exam_question_choices where question_id = eq2) then
    insert into public.exam_question_choices (question_id, choice_text, is_correct, sort_order) values
      (eq2, 'P2', true, 1),
      (eq2, 'P0', false, 2);
  end if;
end $$;
