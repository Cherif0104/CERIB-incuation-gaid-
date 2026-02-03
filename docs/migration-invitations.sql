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
