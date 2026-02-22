-- Ajout du champ mois (1-4) sur learning_modules pour structure MOIS 1 à MOIS 4 côté incubé

alter table public.learning_modules
  add column if not exists mois smallint check (mois is null or (mois >= 1 and mois <= 4));

create index if not exists idx_learning_modules_mois on public.learning_modules (organisation_id, mois);

comment on column public.learning_modules.mois is 'Mois du parcours (1-4) pour affichage côté incubé ; null = non assigné';
