-- SAVANA : Toutes les migrations (à exécuter dans Supabase SQL Editor)
-- Généré par scripts/generate-full-migration.mjs
-- Exécutez ce fichier en une seule fois ou par blocs si trop long.


-- ========== schema.sql ==========
-- Schéma SQL initial pour Supabase (Postgres)
-- À exécuter dans le projet Supabase mfxskmfwongxxuqiubcz

-- 1. ORGANISATIONS
create table if not exists public.organisations (
  id text primary key,
  name text not null,
  account_type text not null,
  main_admin_user_id uuid, -- référence à auth.users.id ou staff_users.id selon choix
  quota_incubes integer default 0,
  quota_coachs integer default 0,
  is_suspended boolean default false,
  created_at timestamptz default now()
);

-- 2. STAFF_USERS (Super Admin, Admin Org, Coach, Certificateur)
create table if not exists public.staff_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  role text not null check (role in ('SUPER_ADMIN', 'ADMIN_ORG', 'COACH', 'CERTIFICATEUR')),
  organisation_id text references public.organisations(id),
  visibility_scope jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_staff_users_org on public.staff_users (organisation_id);

-- 3. PROMOTIONS
create table if not exists public.promotions (
  id text primary key,
  name text not null,
  organisation_id text not null references public.organisations(id) on delete cascade,
  parcours_type text not null check (parcours_type in ('P1', 'P2', 'MIXTE')),
  start_mode text not null check (start_mode in ('P1', 'P2')),
  end_rule text,
  created_at timestamptz default now()
);

create index if not exists idx_promotions_org on public.promotions (organisation_id);

-- 4. INCUBES
create table if not exists public.incubes (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  organisation_id text not null references public.organisations(id) on delete cascade,
  current_parcours text not null check (current_parcours in ('P1', 'P2')),
  p1_score numeric(5,2),
  p2_score numeric(5,2),
  global_status text not null default 'P1_EN_COURS' check (
    global_status in (
      'P1_EN_COURS',
      'P2_EN_COURS',
      'READY_FOR_REVIEW',
      'COACH_VALIDATED',
      'SESSION_SCHEDULED',
      'EXAM_IN_PROGRESS',
      'CERTIFIED',
      'FAILED'
    )
  ),
  created_at timestamptz default now()
);

create index if not exists idx_incubes_org on public.incubes (organisation_id);

-- 5. ASSIGNATIONS
create table if not exists public.assignations (
  id uuid primary key default gen_random_uuid(),
  organisation_id text not null references public.organisations(id) on delete cascade,
  incube_id uuid not null references public.incubes(id) on delete cascade,
  coach_id uuid not null references public.staff_users(id) on delete cascade,
  promotion_id text not null references public.promotions(id) on delete cascade,
  created_at timestamptz default now(),
  unique (incube_id, promotion_id)
);

create index if not exists idx_assignations_org on public.assignations (organisation_id);
create index if not exists idx_assignations_coach on public.assignations (coach_id);

-- 6. CERTIFICATION_SESSIONS
create table if not exists public.certification_sessions (
  id uuid primary key default gen_random_uuid(),
  organisation_id text not null references public.organisations(id) on delete cascade,
  name text,
  start_at timestamptz not null,
  end_at timestamptz not null,
  status text not null default 'SCHEDULED' check (status in ('SCHEDULED', 'OPEN', 'CLOSED')),
  created_at timestamptz default now()
);

create index if not exists idx_cert_sessions_org on public.certification_sessions (organisation_id);

-- 7. CERTIFICATION_CANDIDATES
create table if not exists public.certification_candidates (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.certification_sessions(id) on delete set null,
  incube_id uuid not null references public.incubes(id) on delete cascade,
  organisation_id text not null references public.organisations(id) on delete cascade,
  coach_id uuid not null references public.staff_users(id) on delete cascade,
  coach_validation_at timestamptz,
  certificateur_validation_at timestamptz,
  exam_status text not null default 'PENDING' check (exam_status in ('PENDING', 'IN_PROGRESS', 'DONE')),
  exam_result text check (exam_result in ('CERTIFIED', 'FAILED')),
  created_at timestamptz default now()
);

create index if not exists idx_cert_candidates_org on public.certification_candidates (organisation_id);
create index if not exists idx_cert_candidates_session on public.certification_candidates (session_id);

-- =====================================================================
-- RLS (Row Level Security) - politiques de base
-- =====================================================================

-- Activer RLS
alter table public.organisations enable row level security;
alter table public.staff_users enable row level security;
alter table public.promotions enable row level security;
alter table public.incubes enable row level security;
alter table public.assignations enable row level security;
alter table public.certification_sessions enable row level security;
alter table public.certification_candidates enable row level security;

-- Exemple de rôles applicatifs à mapper côté Supabase:
--   app_super_admin, app_admin_org, app_coach, app_certificateur, app_incube

-- 1) Super Admin : accès global (via rôle technique app_super_admin)
create policy if not exists super_admin_all_organisations
  on public.organisations
  for all
  using (auth.role() = 'app_super_admin')
  with check (auth.role() = 'app_super_admin');

create policy if not exists super_admin_all_staff
  on public.staff_users
  for all
  using (auth.role() = 'app_super_admin')
  with check (auth.role() = 'app_super_admin');

-- 2) Admin Org : accès restreint à son organisation
create policy if not exists admin_org_organisations_select
  on public.organisations
  for select
  using (
    auth.role() = 'app_admin_org'
    and id in (select organisation_id from public.staff_users where auth_user_id = auth.uid())
  );

create policy if not exists admin_org_staff_org
  on public.staff_users
  for all
  using (
    auth.role() = 'app_admin_org'
    and organisation_id in (
      select organisation_id from public.staff_users where auth_user_id = auth.uid()
    )
  )
  with check (
    auth.role() = 'app_admin_org'
    and organisation_id in (
      select organisation_id from public.staff_users where auth_user_id = auth.uid()
    )
  );

-- 3) Coach : accès à ses assignations et incubes liés
create policy if not exists coach_assignations
  on public.assignations
  for select
  using (
    auth.role() = 'app_coach'
    and coach_id in (select id from public.staff_users where auth_user_id = auth.uid())
  );

create policy if not exists coach_incubes
  on public.incubes
  for select
  using (
    auth.role() = 'app_coach'
    and id in (
      select incube_id
      from public.assignations
      where coach_id in (select id from public.staff_users where auth_user_id = auth.uid())
    )
  );

-- 4) Certificateur : vue transversale sur les candidats de certification
create policy if not exists certificateur_candidates
  on public.certification_candidates
  for select
  using (auth.role() = 'app_certificateur');

-- 5) Incubé : accès uniquement à ses propres données
create policy if not exists incube_self
  on public.incubes
  for select
  using (
    auth.role() = 'app_incube'
    and auth_user_id = auth.uid()
  );



-- ========== migration-organisations-extended.sql ==========
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


-- ========== migration-rls-read-own-profile.sql ==========
-- RLS : permettre à tout utilisateur connecté de lire sa propre ligne (profil)
-- pour que l'app puisse charger le rôle et rediriger vers le bon dashboard.
-- Sans cela, le JWT Supabase a role = 'authenticated', pas 'app_admin_org' etc.,
-- donc les politiques existantes bloquent la lecture du profil.

-- Lecture de sa propre ligne dans staff_users (pour tout auth_user_id = auth.uid())
create policy if not exists staff_users_select_own
  on public.staff_users
  for select
  using (auth_user_id = auth.uid());

-- Lecture de sa propre ligne dans incubes
create policy if not exists incubes_select_own
  on public.incubes
  for select
  using (auth_user_id = auth.uid());


-- ========== migration-rls-super-admin-organisations.sql ==========
-- RLS : permettre au Super Admin (identifié via staff_users.role = 'SUPER_ADMIN')
-- de créer, lire, modifier et supprimer les organisations et de gérer staff_users.
-- Sans cette migration, auth.role() vaut 'authenticated' dans le JWT Supabase,
-- donc la politique super_admin_all_organisations (auth.role() = 'app_super_admin') ne passe jamais
-- et la création d'organisation depuis le dashboard Super Admin échoue (non persistante).

-- Organisations : tout pour le Super Admin via staff_users
drop policy if exists super_admin_organisations_via_staff on public.organisations;
create policy super_admin_organisations_via_staff
  on public.organisations
  for all
  to authenticated
  using (
    exists (select 1 from public.staff_users where auth_user_id = auth.uid() and role = 'SUPER_ADMIN')
  )
  with check (
    exists (select 1 from public.staff_users where auth_user_id = auth.uid() and role = 'SUPER_ADMIN')
  );

-- Staff_users : tout pour le Super Admin (lecture globale, insert pour create-platform-user, etc.)
drop policy if exists super_admin_staff_via_staff on public.staff_users;
create policy super_admin_staff_via_staff
  on public.staff_users
  for all
  to authenticated
  using (
    exists (select 1 from public.staff_users s where s.auth_user_id = auth.uid() and s.role = 'SUPER_ADMIN')
  )
  with check (
    exists (select 1 from public.staff_users s where s.auth_user_id = auth.uid() and s.role = 'SUPER_ADMIN')
  );


-- ========== migration-rls-admin-org-crud.sql ==========
-- RLS : permettre à l'Admin Org de modifier/supprimer les entités de son organisation
-- (promotions, assignations, codes d'invitation). Utilise staff_users, pas auth.role().

-- Promotions : Admin Org tout (SELECT, INSERT, UPDATE, DELETE) sur les promotions de son org
drop policy if exists admin_org_promotions_all on public.promotions;
create policy admin_org_promotions_all
  on public.promotions for all
  to authenticated
  using (
    organisation_id in (
      select organisation_id from public.staff_users
      where auth_user_id = auth.uid() and role in ('ADMIN_ORG', 'ADMIN')
    )
  )
  with check (
    organisation_id in (
      select organisation_id from public.staff_users
      where auth_user_id = auth.uid() and role in ('ADMIN_ORG', 'ADMIN')
    )
  );

-- Assignations : Admin Org tout sur les assignations de son org
drop policy if exists admin_org_assignations_all on public.assignations;
create policy admin_org_assignations_all
  on public.assignations for all
  to authenticated
  using (
    organisation_id in (
      select organisation_id from public.staff_users
      where auth_user_id = auth.uid() and role in ('ADMIN_ORG', 'ADMIN')
    )
  )
  with check (
    organisation_id in (
      select organisation_id from public.staff_users
      where auth_user_id = auth.uid() and role in ('ADMIN_ORG', 'ADMIN')
    )
  );

-- Invitation codes : Admin Org peut mettre à jour et supprimer les codes de son org
drop policy if exists admin_org_invitation_codes_update on public.invitation_codes;
create policy admin_org_invitation_codes_update
  on public.invitation_codes for update
  to authenticated
  using (
    organisation_id in (
      select organisation_id from public.staff_users su
      where su.auth_user_id = auth.uid() and su.role in ('ADMIN_ORG', 'ADMIN')
    )
  )
  with check (
    organisation_id in (
      select organisation_id from public.staff_users su
      where su.auth_user_id = auth.uid() and su.role in ('ADMIN_ORG', 'ADMIN')
    )
  );

drop policy if exists admin_org_invitation_codes_delete on public.invitation_codes;
create policy admin_org_invitation_codes_delete
  on public.invitation_codes for delete
  to authenticated
  using (
    organisation_id in (
      select organisation_id from public.staff_users su
      where su.auth_user_id = auth.uid() and su.role in ('ADMIN_ORG', 'ADMIN')
    )
  );

-- Certification sessions : Certificateur et Admin Org peuvent tout faire sur les sessions de leur org
drop policy if exists cert_sessions_certificateur_admin_org_all on public.certification_sessions;
create policy cert_sessions_certificateur_admin_org_all
  on public.certification_sessions for all
  to authenticated
  using (
    organisation_id in (
      select organisation_id from public.staff_users
      where auth_user_id = auth.uid() and role in ('CERTIFICATEUR', 'ADMIN_ORG', 'ADMIN')
    )
  )
  with check (
    organisation_id in (
      select organisation_id from public.staff_users
      where auth_user_id = auth.uid() and role in ('CERTIFICATEUR', 'ADMIN_ORG', 'ADMIN')
    )
  );


-- ========== migration-invitations.sql ==========
-- Codes d'invitation pour inscrire les incubés (inscription contrôlée)
-- À exécuter dans Supabase après le schéma principal

-- Table des codes d'invitation (générés par Admin Org)
create table if not exists public.invitation_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  organisation_id text not null references public.organisations(id) on delete cascade,
  expires_at timestamptz not null,
  max_uses integer not null default 1,
  used_count integer not null default 0,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

create index if not exists idx_invitation_codes_code on public.invitation_codes (code);
alter table public.invitation_codes enable row level security;

-- Valider un code (appelable sans être connecté) — retourne org_id et org_name si valide
create or replace function public.validate_invitation_code(p_code text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id text;
  v_org_name text;
begin
  select ic.organisation_id, o.name
  into v_org_id, v_org_name
  from invitation_codes ic
  join organisations o on o.id = ic.organisation_id
  where ic.code = trim(lower(p_code))
    and ic.expires_at > now()
    and ic.used_count < ic.max_uses;
  if v_org_id is null then
    return json_build_object('valid', false);
  end if;
  return json_build_object('valid', true, 'org_id', v_org_id, 'org_name', v_org_name);
end;
$$;

-- Accepter une invitation après sign-up (utilisateur connecté) — crée la ligne incubes et consomme le code
create or replace function public.accept_invitation(p_code text, p_full_name text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_email text;
  v_org_id text;
  v_code_id uuid;
begin
  v_uid := auth.uid();
  if v_uid is null then
    return json_build_object('success', false, 'error', 'Non authentifié');
  end if;
  select email into v_email from auth.users where id = v_uid;
  if v_email is null then
    return json_build_object('success', false, 'error', 'Email introuvable');
  end if;

  select ic.id, ic.organisation_id
  into v_code_id, v_org_id
  from invitation_codes ic
  where ic.code = trim(lower(p_code))
    and ic.expires_at > now()
    and ic.used_count < ic.max_uses
  for update;

  if v_code_id is null then
    return json_build_object('success', false, 'error', 'Code invalide ou expiré');
  end if;

  insert into incubes (auth_user_id, full_name, email, organisation_id, current_parcours, global_status)
  values (v_uid, nullif(trim(p_full_name), ''), v_email, v_org_id, 'P1', 'P1_EN_COURS');

  update invitation_codes set used_count = used_count + 1 where id = v_code_id;

  return json_build_object('success', true);
end;
$$;

-- Permettre à tout le monde d'appeler validate (anon) et aux utilisateurs connectés d'appeler accept
grant execute on function public.validate_invitation_code(text) to anon;
grant execute on function public.validate_invitation_code(text) to authenticated;
grant execute on function public.accept_invitation(text, text) to authenticated;


-- ========== rls-invitation_codes.sql ==========
-- RLS pour invitation_codes : Admin Org (lecture/création pour son org), Super Admin (tout)
-- À exécuter après migration-invitations.sql

-- Super Admin : tout voir et tout faire sur invitation_codes
create policy if not exists super_admin_invitation_codes_all
on public.invitation_codes
for all
to authenticated
using (
  exists (
    select 1 from public.staff_users su
    where su.auth_user_id = auth.uid() and su.role = 'SUPER_ADMIN'
  )
)
with check (
  exists (
    select 1 from public.staff_users su
    where su.auth_user_id = auth.uid() and su.role = 'SUPER_ADMIN'
  )
);

-- Admin Org : voir et créer les codes de son organisation uniquement
create policy if not exists admin_org_invitation_codes_select
on public.invitation_codes
for select
to authenticated
using (
  organisation_id in (
    select su.organisation_id from public.staff_users su
    where su.auth_user_id = auth.uid() and su.role = 'ADMIN_ORG'
  )
);

create policy if not exists admin_org_invitation_codes_insert
on public.invitation_codes
for insert
to authenticated
with check (
  organisation_id in (
    select su.organisation_id from public.staff_users su
    where su.auth_user_id = auth.uid() and su.role = 'ADMIN_ORG'
  )
);


-- ========== migration-admin-invitations.sql ==========
-- Invitations administrateur d'organisation (Super Admin invite un Admin Org)
-- À exécuter après schema.sql

create table if not exists public.admin_invitations (
  id uuid primary key default gen_random_uuid(),
  organisation_id text not null references public.organisations(id) on delete cascade,
  email text not null,
  full_name text,
  token text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists idx_admin_invitations_token on public.admin_invitations (token);
create index if not exists idx_admin_invitations_organisation_id on public.admin_invitations (organisation_id);
alter table public.admin_invitations enable row level security;

-- Créer une invitation (Super Admin uniquement) — retourne token pour construire l'URL côté app
create or replace function public.create_admin_invitation(p_organisation_id text, p_email text, p_full_name text default null)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_super_admin boolean;
  v_token text;
  v_expires_at timestamptz;
begin
  select exists (select 1 from staff_users where auth_user_id = auth.uid() and role = 'SUPER_ADMIN') into v_is_super_admin;
  if not v_is_super_admin then
    return json_build_object('success', false, 'error', 'Non autorisé');
  end if;
  if not exists (select 1 from organisations where id = p_organisation_id) then
    return json_build_object('success', false, 'error', 'Organisation introuvable');
  end if;

  v_token := encode(gen_random_bytes(32), 'hex');
  v_expires_at := now() + interval '7 days';

  insert into admin_invitations (organisation_id, email, full_name, token, expires_at)
  values (p_organisation_id, trim(lower(p_email)), nullif(trim(p_full_name), ''), v_token, v_expires_at);

  return json_build_object('success', true, 'token', v_token, 'expires_at', v_expires_at);
end;
$$;

-- Valider un token d'invitation admin (appelable sans être connecté ou avant login) — pour afficher la page
create or replace function public.validate_admin_invitation_token(p_token text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_record record;
begin
  select ai.email, ai.full_name, ai.organisation_id, o.name as org_name
  into v_record
  from admin_invitations ai
  join organisations o on o.id = ai.organisation_id
  where ai.token = trim(p_token)
    and ai.used_at is null
    and ai.expires_at > now();

  if v_record.email is null then
    return json_build_object('valid', false);
  end if;
  return json_build_object('valid', true, 'email', v_record.email, 'full_name', v_record.full_name, 'org_name', v_record.org_name, 'organisation_id', v_record.organisation_id);
end;
$$;

-- Consommer l'invitation après signUp/signIn : crée ou met à jour staff_users (ADMIN_ORG), marque l'invitation utilisée
create or replace function public.consume_admin_invitation(p_token text, p_full_name text default null)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_email text;
  v_org_id text;
  v_inv_id uuid;
  v_inv_email text;
  v_inv_full_name text;
  v_staff_id uuid;
  v_name text;
begin
  v_uid := auth.uid();
  if v_uid is null then
    return json_build_object('success', false, 'error', 'Non authentifié');
  end if;

  select email into v_email from auth.users where id = v_uid;
  if v_email is null then
    return json_build_object('success', false, 'error', 'Email introuvable');
  end if;

  select ai.id, ai.organisation_id, ai.email, ai.full_name
  into v_inv_id, v_org_id, v_inv_email, v_inv_full_name
  from admin_invitations ai
  where ai.token = trim(p_token)
    and ai.used_at is null
    and ai.expires_at > now()
  for update;

  if v_inv_id is null then
    return json_build_object('success', false, 'error', 'Lien invalide ou déjà utilisé');
  end if;

  if trim(lower(v_inv_email)) <> trim(lower(v_email)) then
    return json_build_object('success', false, 'error', 'L’invitation est destinée à un autre email');
  end if;

  v_name := nullif(trim(coalesce(p_full_name, v_inv_full_name, '')), '');
  if v_name is null then
    v_name := v_email;
  end if;

  insert into staff_users (auth_user_id, full_name, email, role, organisation_id)
  values (v_uid, v_name, v_email, 'ADMIN_ORG', v_org_id)
  on conflict (email) do update set
    auth_user_id = excluded.auth_user_id,
    full_name = coalesce(nullif(trim(excluded.full_name), ''), staff_users.full_name),
    role = 'ADMIN_ORG',
    organisation_id = excluded.organisation_id;

  select id into v_staff_id from staff_users where email = v_email;

  update admin_invitations set used_at = now() where id = v_inv_id;

  update organisations set main_admin_user_id = v_staff_id where id = v_org_id and main_admin_user_id is null;

  return json_build_object('success', true);
end;
$$;

grant execute on function public.create_admin_invitation(text, text, text) to authenticated;
grant execute on function public.validate_admin_invitation_token(text) to anon;
grant execute on function public.validate_admin_invitation_token(text) to authenticated;
grant execute on function public.consume_admin_invitation(text, text) to authenticated;


-- ========== migration-coaching-requests.sql ==========
-- Demandes de coaching (levée de main) : incubé → coach
-- À exécuter après le schéma principal

create table if not exists public.coaching_requests (
  id uuid primary key default gen_random_uuid(),
  incube_id uuid not null references public.incubes(id) on delete cascade,
  coach_id uuid not null references public.staff_users(id) on delete cascade,
  organisation_id text not null references public.organisations(id) on delete cascade,
  status text not null default 'PENDING' check (status in ('PENDING', 'ACCEPTED', 'DONE', 'CANCELLED')),
  message text,
  created_at timestamptz default now(),
  responded_at timestamptz
);

create index if not exists idx_coaching_requests_incube on public.coaching_requests (incube_id);
create index if not exists idx_coaching_requests_coach on public.coaching_requests (coach_id);
alter table public.coaching_requests enable row level security;

-- RLS : incubé voit ses demandes, coach voit les demandes qui lui sont adressées
create policy if not exists incube_coaching_requests_own
  on public.coaching_requests for all
  to authenticated
  using (
    incube_id in (select id from public.incubes where auth_user_id = auth.uid())
  )
  with check (
    incube_id in (select id from public.incubes where auth_user_id = auth.uid())
  );

create policy if not exists coach_coaching_requests_incoming
  on public.coaching_requests for select
  to authenticated
  using (
    coach_id in (select id from public.staff_users where auth_user_id = auth.uid())
  );

-- Coach peut mettre à jour (accepter, marquer fait)
create policy if not exists coach_coaching_requests_update
  on public.coaching_requests for update
  to authenticated
  using (
    coach_id in (select id from public.staff_users where auth_user_id = auth.uid())
  );


-- ========== migration-super-admin-coaching-requests.sql ==========
-- Super Admin : lecture de toutes les demandes de coaching (DEMANDES & ALERTES)
alter table public.coaching_requests enable row level security;

create policy if not exists super_admin_coaching_requests_select
  on public.coaching_requests for select
  to authenticated
  using (
    exists (select 1 from public.staff_users where auth_user_id = auth.uid() and role = 'SUPER_ADMIN')
  );


-- ========== migration-pedagogie.sql ==========
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


-- ========== migration-modules-extensible.sql ==========
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


-- ========== migration-learning-modules-promotion-formateur.sql ==========
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


-- ========== migration-vision-client-learning-modules-mois.sql ==========
-- Ajout du champ mois (1-4) sur learning_modules pour structure MOIS 1 à MOIS 4 côté incubé

alter table public.learning_modules
  add column if not exists mois smallint check (mois is null or (mois >= 1 and mois <= 4));

create index if not exists idx_learning_modules_mois on public.learning_modules (organisation_id, mois);

comment on column public.learning_modules.mois is 'Mois du parcours (1-4) pour affichage côté incubé ; null = non assigné';


-- ========== migration-learning-modules-admin-org-delete.sql ==========
-- Permettre à l'admin org de supprimer/modifier les modules de son organisation
-- sans dépendre de auth.role() = 'app_admin_org' (souvent non défini dans le JWT Supabase).
-- On s'appuie uniquement sur staff_users (auth_user_id = auth.uid() et role ADMIN_ORG/ADMIN).

drop policy if exists learning_modules_admin_org on public.learning_modules;
create policy learning_modules_admin_org
  on public.learning_modules for all
  using (
    organisation_id is null
    or organisation_id in (
      select organisation_id from public.staff_users
      where auth_user_id = auth.uid() and role in ('ADMIN_ORG', 'ADMIN')
    )
  )
  with check (
    organisation_id is null
    or organisation_id in (
      select organisation_id from public.staff_users
      where auth_user_id = auth.uid() and role in ('ADMIN_ORG', 'ADMIN')
    )
  );

drop policy if exists module_quiz_questions_admin_org on public.module_quiz_questions;
create policy module_quiz_questions_admin_org
  on public.module_quiz_questions for all
  using (
    exists (
      select 1 from public.learning_modules m
      where m.id = module_id
      and (m.organisation_id is null or m.organisation_id in (
        select organisation_id from public.staff_users
        where auth_user_id = auth.uid() and role in ('ADMIN_ORG', 'ADMIN')
      ))
    )
  )
  with check (
    exists (
      select 1 from public.learning_modules m
      where m.id = module_id
      and (m.organisation_id is null or m.organisation_id in (
        select organisation_id from public.staff_users
        where auth_user_id = auth.uid() and role in ('ADMIN_ORG', 'ADMIN')
      ))
    )
  );

drop policy if exists module_quiz_choices_admin_org on public.module_quiz_choices;
create policy module_quiz_choices_admin_org
  on public.module_quiz_choices for all
  using (
    exists (
      select 1 from public.module_quiz_questions q
      join public.learning_modules m on m.id = q.module_id
      where q.id = question_id
      and (m.organisation_id is null or m.organisation_id in (
        select organisation_id from public.staff_users
        where auth_user_id = auth.uid() and role in ('ADMIN_ORG', 'ADMIN')
      ))
    )
  )
  with check (
    exists (
      select 1 from public.module_quiz_questions q
      join public.learning_modules m on m.id = q.module_id
      where q.id = question_id
      and (m.organisation_id is null or m.organisation_id in (
        select organisation_id from public.staff_users
        where auth_user_id = auth.uid() and role in ('ADMIN_ORG', 'ADMIN')
      ))
    )
  );


-- ========== migration-vision-client-incube-params.sql ==========
-- Paramètres incubé (Coach/Admin) + validation par mois
-- Vision client MVP : Temps (h), Sessions, Max SOS, Max RDV ; validation "mois" par le coach

-- Colonnes sur incubes
alter table public.incubes
  add column if not exists temps_h integer default 4,
  add column if not exists sessions integer default 2,
  add column if not exists max_sos integer default 1,
  add column if not exists max_rdv integer default 1;

-- Validation d'un mois par le coach (Mois 1 à 4)
create table if not exists public.incube_mois_validation (
  id uuid primary key default gen_random_uuid(),
  incube_id uuid not null references public.incubes(id) on delete cascade,
  mois_num smallint not null check (mois_num >= 1 and mois_num <= 4),
  validated_at timestamptz not null default now(),
  coach_id uuid not null references public.staff_users(id) on delete cascade,
  comment text,
  unique (incube_id, mois_num)
);

create index if not exists idx_incube_mois_validation_incube on public.incube_mois_validation (incube_id);
create index if not exists idx_incube_mois_validation_coach on public.incube_mois_validation (coach_id);
alter table public.incube_mois_validation enable row level security;

create policy incube_mois_validation_incube_select
  on public.incube_mois_validation for select
  using (incube_id in (select id from public.incubes where auth_user_id = auth.uid()));

create policy incube_mois_validation_coach_all
  on public.incube_mois_validation for all
  using (coach_id in (select id from public.staff_users where auth_user_id = auth.uid()))
  with check (coach_id in (select id from public.staff_users where auth_user_id = auth.uid()));

create policy incube_mois_validation_admin_org
  on public.incube_mois_validation for all
  using (
    exists (
      select 1 from public.incubes i
      join public.staff_users s on s.organisation_id = i.organisation_id and s.auth_user_id = auth.uid()
      where i.id = incube_id
    )
  );


-- ========== migration-vision-client-rdv-messages.sql ==========
-- RDV / Convocations : extension coaching_requests + table messages (messagerie & SOS)

-- Extension coaching_requests pour RDV
alter table public.coaching_requests
  add column if not exists objectif text,
  add column if not exists travail_preparatoire text,
  add column if not exists scheduled_at timestamptz,
  add column if not exists platform text,
  add column if not exists meeting_link text,
  add column if not exists is_urgence boolean default false,
  add column if not exists mois_num smallint,
  add column if not exists request_type text default 'COACHING' check (request_type in ('COACHING', 'RDV', 'SOS_URGENCE'));

-- Table messages (échanges coach <-> incubé)
create table if not exists public.coach_incube_messages (
  id uuid primary key default gen_random_uuid(),
  incube_id uuid not null references public.incubes(id) on delete cascade,
  coach_id uuid not null references public.staff_users(id) on delete cascade,
  body text not null,
  is_urgence boolean default false,
  from_incube boolean not null default true,
  created_at timestamptz default now()
);

create index if not exists idx_coach_incube_messages_incube on public.coach_incube_messages (incube_id);
create index if not exists idx_coach_incube_messages_coach on public.coach_incube_messages (coach_id);
alter table public.coach_incube_messages enable row level security;

create policy coach_incube_messages_incube
  on public.coach_incube_messages for all
  using (incube_id in (select id from public.incubes where auth_user_id = auth.uid()))
  with check (incube_id in (select id from public.incubes where auth_user_id = auth.uid()) and from_incube = true);

create policy coach_incube_messages_coach
  on public.coach_incube_messages for all
  using (coach_id in (select id from public.staff_users where auth_user_id = auth.uid()))
  with check (coach_id in (select id from public.staff_users where auth_user_id = auth.uid()) and from_incube = false);


-- ========== migration-vision-client-toolbox.sql ==========
-- Boîte à outils : documents par organisation (téléchargeables par les incubés)

create table if not exists public.toolbox_documents (
  id uuid primary key default gen_random_uuid(),
  organisation_id text not null references public.organisations(id) on delete cascade,
  title text not null,
  type text, -- ex. 'word', 'excel', 'pdf'
  file_url text not null,
  sort_order int not null default 0,
  created_at timestamptz default now()
);

create index if not exists idx_toolbox_documents_org on public.toolbox_documents (organisation_id);
alter table public.toolbox_documents enable row level security;

create policy toolbox_documents_select_org
  on public.toolbox_documents for select
  using (
    organisation_id in (select organisation_id from public.incubes where auth_user_id = auth.uid())
    or organisation_id in (select organisation_id from public.staff_users where auth_user_id = auth.uid())
  );

create policy toolbox_documents_admin_org
  on public.toolbox_documents for all
  using (
    organisation_id in (select organisation_id from public.staff_users where auth_user_id = auth.uid() and role in ('ADMIN_ORG', 'ADMIN'))
  )
  with check (
    organisation_id in (select organisation_id from public.staff_users where auth_user_id = auth.uid() and role in ('ADMIN_ORG', 'ADMIN'))
  );

create policy toolbox_documents_super_admin
  on public.toolbox_documents for all
  using (auth.role() = 'app_super_admin')
  with check (auth.role() = 'app_super_admin');


-- ========== migration-storage-toolbox-documents.sql ==========
-- Bucket Storage pour les documents de la boîte à outils (upload prioritaire)
-- À exécuter dans Supabase SQL Editor après avoir activé Storage.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'toolbox-documents',
  'toolbox-documents',
  false,
  52428800,
  array['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'image/png', 'image/jpeg', 'video/mp4', 'video/webm', 'text/plain']
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "toolbox_documents_insert" on storage.objects;
create policy "toolbox_documents_insert" on storage.objects for insert
with check (
  bucket_id = 'toolbox-documents'
  and exists (select 1 from public.staff_users s where s.auth_user_id = auth.uid() and s.role in ('ADMIN_ORG', 'ADMIN'))
);

drop policy if exists "toolbox_documents_update" on storage.objects;
create policy "toolbox_documents_update" on storage.objects for update
using (bucket_id = 'toolbox-documents' and exists (select 1 from public.staff_users s where s.auth_user_id = auth.uid() and s.role in ('ADMIN_ORG', 'ADMIN')));

drop policy if exists "toolbox_documents_delete" on storage.objects;
create policy "toolbox_documents_delete" on storage.objects for delete
using (bucket_id = 'toolbox-documents' and exists (select 1 from public.staff_users s where s.auth_user_id = auth.uid() and s.role in ('ADMIN_ORG', 'ADMIN')));

drop policy if exists "toolbox_documents_select" on storage.objects;
create policy "toolbox_documents_select" on storage.objects for select
using (
  bucket_id = 'toolbox-documents'
  and (exists (select 1 from public.staff_users s where s.auth_user_id = auth.uid())
    or exists (select 1 from public.incubes i where i.auth_user_id = auth.uid()))
);


-- ========== migration-storage-module-assets.sql ==========
-- Bucket Storage pour les assets des modules (vidéos, documents uploadés)
-- À exécuter dans Supabase SQL Editor après avoir activé Storage.

-- Créer le bucket (privé ; accès via URL signée)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'module-assets',
  'module-assets',
  false,
  52428800,
  array['video/mp4', 'video/webm', 'video/quicktime', 'application/pdf', 'image/png', 'image/jpeg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Politiques : admins org peuvent écrire ; staff et incubés peuvent lire (URL signée côté app)
drop policy if exists "module_assets_insert" on storage.objects;
create policy "module_assets_insert" on storage.objects for insert
with check (
  bucket_id = 'module-assets'
  and exists (select 1 from public.staff_users s where s.auth_user_id = auth.uid() and s.role in ('ADMIN_ORG', 'ADMIN'))
);

drop policy if exists "module_assets_update" on storage.objects;
create policy "module_assets_update" on storage.objects for update
using (bucket_id = 'module-assets' and exists (select 1 from public.staff_users s where s.auth_user_id = auth.uid() and s.role in ('ADMIN_ORG', 'ADMIN')));

drop policy if exists "module_assets_delete" on storage.objects;
create policy "module_assets_delete" on storage.objects for delete
using (bucket_id = 'module-assets' and exists (select 1 from public.staff_users s where s.auth_user_id = auth.uid() and s.role in ('ADMIN_ORG', 'ADMIN')));

drop policy if exists "module_assets_select" on storage.objects;
create policy "module_assets_select" on storage.objects for select
using (
  bucket_id = 'module-assets'
  and (exists (select 1 from public.staff_users s where s.auth_user_id = auth.uid())
    or exists (select 1 from public.incubes i where i.auth_user_id = auth.uid()))
);


-- ========== migration-qcm-certification.sql ==========
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


-- ========== migration-p1-p2-progression.sql ==========
-- Progression automatique P1 → P2 : quand score P1 ≥ 70 %, passage en P2
-- À exécuter dans Supabase (SQL Editor)

-- Seuil configurable (70 %)
create or replace function public.check_p1_to_p2_progression()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.p1_score is not null
     and new.p1_score >= 70
     and coalesce(new.current_parcours, 'P1') = 'P1' then
    new.current_parcours := 'P2';
    if new.global_status = 'P1_EN_COURS' then
      new.global_status := 'P2_EN_COURS';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trigger_p1_to_p2 on public.incubes;
create trigger trigger_p1_to_p2
  before update on public.incubes
  for each row
  execute function public.check_p1_to_p2_progression();

comment on function public.check_p1_to_p2_progression() is
  'Passe automatiquement un incubé en P2 quand p1_score >= 70 % (seuil métier CERIP).';


-- ========== migration-rls-admin-org-incubes.sql ==========
-- Admin Org : lecture des incubés de son organisation (pour la page Incubés / avancement).

create policy if not exists admin_org_incubes_select
  on public.incubes
  for select
  using (
    exists (
      select 1 from public.staff_users s
      where s.auth_user_id = auth.uid()
        and s.role = 'ADMIN_ORG'
        and s.organisation_id = incubes.organisation_id
    )
  );

-- Admin Org : lecture de la progression modules des incubés de son organisation (pour colonne "Modules complétés").
create policy if not exists admin_org_incube_module_progress_select
  on public.incube_module_progress
  for select
  using (
    incube_id in (
      select i.id from public.incubes i
      join public.staff_users s on s.organisation_id = i.organisation_id and s.auth_user_id = auth.uid() and s.role = 'ADMIN_ORG'
    )
  );


-- ========== migration-rls-update-own-profile.sql ==========
-- Permettre à chaque utilisateur de mettre à jour sa propre ligne (full_name, etc.)
-- Nécessaire pour la page Profil / Paramètres.

create policy if not exists staff_users_update_own
  on public.staff_users
  for update
  using (auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid());

create policy if not exists incubes_update_own
  on public.incubes
  for update
  using (auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid());


-- ========== migration-start-certification-exam.sql ==========
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

-- ========== SUPER ADMIN ==========
-- Crée le lien staff_users pour contact.cherif.pro@gmail.com (Super Admin)
-- Prérequis : créer l'utilisateur dans Authentication → Users → Add user
insert into public.staff_users (auth_user_id, full_name, email, role, organisation_id)
select id, 'Contact Cherif Pro', 'contact.cherif.pro@gmail.com', 'SUPER_ADMIN', null
from auth.users where email = 'contact.cherif.pro@gmail.com'
on conflict (email) do update set role = 'SUPER_ADMIN', full_name = excluded.full_name, auth_user_id = excluded.auth_user_id;

