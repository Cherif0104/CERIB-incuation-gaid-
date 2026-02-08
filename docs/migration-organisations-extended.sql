-- Extension des organisations : forme juridique, secteur, géographie Sénégal, identification
-- À exécuter dans Supabase SQL Editor après schema.sql

alter table public.organisations
  add column if not exists legal_form text check (legal_form is null or legal_form in ('ONG', 'GIE', 'SARL', 'SA', 'SNC', 'SUARL', 'SI', 'PME')),
  add column if not exists sector_activity text,
  add column if not exists region text,
  add column if not exists department text,
  add column if not exists commune text,
  add column if not exists address text,
  add column if not exists phone text,
  add column if not exists email_org text,
  add column if not exists ninea text;

comment on column public.organisations.legal_form is 'Forme juridique : ONG, GIE, SARL, SA, SNC, SUARL, SI, PME';
comment on column public.organisations.sector_activity is 'Secteur d''activité';
comment on column public.organisations.region is 'Région (Sénégal)';
comment on column public.organisations.department is 'Département (Sénégal)';
comment on column public.organisations.commune is 'Commune (Sénégal)';
comment on column public.organisations.email_org is 'Email de l''organisation';
comment on column public.organisations.ninea is 'NINEA (optionnel)';
