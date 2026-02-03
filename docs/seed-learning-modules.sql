-- Seed minimal : modules P1/P2 pour une organisation (à adapter org_id)
-- À exécuter après migration-pedagogie.sql

-- Exemple : org CERIP-DEMO (remplacer par un id réel si besoin)
insert into public.learning_modules (id, organisation_id, parcours_phase, title, description, sort_order, type, payload)
values
  (gen_random_uuid(), 'CERIP-DEMO', 'P1', 'Bienvenue en P1', 'Introduction au parcours premier niveau.', 1, 'text', '{}'),
  (gen_random_uuid(), 'CERIP-DEMO', 'P1', 'Quiz P1 – Fondamentaux', 'QCM de validation des acquis P1.', 2, 'quiz', '{}'),
  (gen_random_uuid(), 'CERIP-DEMO', 'P2', 'Module P2 – Approfondissement', 'Contenu avancé pour la phase 2.', 1, 'text', '{}')
on conflict do nothing;

-- Questions pour le quiz P1 (récupérer module_id du module type quiz P1 ci-dessus)
-- À exécuter en remplaçant :module_id par l'id du module "Quiz P1 – Fondamentaux"
/*
do $$
declare
  mid uuid;
  q1 uuid;
  q2 uuid;
begin
  select id into mid from public.learning_modules where organisation_id = 'CERIP-DEMO' and type = 'quiz' and parcours_phase = 'P1' limit 1;
  if mid is null then return; end if;
  insert into public.module_quiz_questions (id, module_id, question_text, sort_order) values (gen_random_uuid(), mid, 'Question 1 : Quelle est la première étape ?', 1) returning id into q1;
  insert into public.module_quiz_questions (id, module_id, question_text, sort_order) values (gen_random_uuid(), mid, 'Question 2 : Que signifie CERIP ?', 2) returning id into q2;
  insert into public.module_quiz_choices (question_id, choice_text, is_correct, sort_order) values (q1, 'Réponse A (correcte)', true, 1), (q1, 'Réponse B', false, 2);
  insert into public.module_quiz_choices (question_id, choice_text, is_correct, sort_order) values (q2, 'Centre d''Études', false, 1), (q2, 'Centre d''Études et de Recherches pour l''Innovation et le Partenariat', true, 2);
end $$;
*/
