-- Migration : ajout des dates de démarrage aux promotions (cohortes/sessions)
-- Les promotions représentent des sessions ou cohortes avec une date de début.

alter table public.promotions
  add column if not exists start_date date;

alter table public.promotions
  add column if not exists end_date date;

create index if not exists idx_promotions_start_date on public.promotions (start_date);

comment on column public.promotions.start_date is 'Date de démarrage de la cohorte/session';
comment on column public.promotions.end_date is 'Date de fin prévue (optionnel)';
