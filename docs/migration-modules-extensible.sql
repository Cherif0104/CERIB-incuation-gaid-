-- Modules pédagogiques : type document, phase P3, champs extensibles
-- À exécuter dans Supabase → SQL Editor (après migration-pedagogie.sql)

-- 1. Étendre le type des modules : ajouter 'document'
alter table public.learning_modules drop constraint if exists learning_modules_type_check;
alter table public.learning_modules add constraint learning_modules_type_check
  check (type in ('video', 'quiz', 'text', 'document'));

-- 2. Étendre les phases possibles : ajouter P3 (optionnel / autre)
alter table public.learning_modules drop constraint if exists learning_modules_parcours_phase_check;
alter table public.learning_modules add constraint learning_modules_parcours_phase_check
  check (parcours_phase in ('P1', 'P2', 'P3'));

-- 3. Questions de quiz : autoriser question_text vide (brouillon à compléter plus tard)
alter table public.module_quiz_questions alter column question_text drop not null;
