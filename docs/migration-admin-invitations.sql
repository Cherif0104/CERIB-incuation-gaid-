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
