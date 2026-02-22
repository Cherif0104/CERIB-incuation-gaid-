-- Liaison obligatoire Module -> Promotion et Formateur (coach)
-- À exécuter dans Supabase SQL Editor.

-- Colonnes nullable pour ne pas casser les modules existants (à renseigner à l'édition)
alter table public.learning_modules
  add column if not exists promotion_id text references public.promotions(id) on delete restrict;
alter table public.learning_modules
  add column if not exists formateur_id uuid references public.staff_users(id) on delete restrict;

create index if not exists idx_learning_modules_promotion on public.learning_modules (promotion_id);
create index if not exists idx_learning_modules_formateur on public.learning_modules (formateur_id);

comment on column public.learning_modules.promotion_id is 'Promotion à laquelle le module est associé (obligatoire à la création)';
comment on column public.learning_modules.formateur_id is 'Formateur/entraîneur (coach) responsable du module (obligatoire à la création)';
