-- Correction RPC invitations admin : alignement frontend / backend
-- Le frontend appelle accept_admin_invitation et invite_admin ; les migrations définissent consume_admin_invitation et create_admin_invitation.
-- Ce script crée les alias nécessaires pour que le flux fonctionne sans modifier le frontend.

-- 1) Alias accept_admin_invitation → consume_admin_invitation
-- AcceptAdminInvitationPage appelle : supabase.rpc('accept_admin_invitation', { p_token })
create or replace function public.accept_admin_invitation(p_token text, p_full_name text default null)
returns json
language sql
security definer
set search_path = public
as $$
  select consume_admin_invitation(p_token, p_full_name);
$$;

grant execute on function public.accept_admin_invitation(text, text) to authenticated;

-- 2) Alias invite_admin → create_admin_invitation
-- SuperAdminOrgDetailPage et SuperAdminDashboard appellent : supabase.rpc('invite_admin', { org_id, email, full_name? })
create or replace function public.invite_admin(org_id text, email text, full_name text default null)
returns json
language sql
security definer
set search_path = public
as $$
  select create_admin_invitation(org_id, email, full_name);
$$;

grant execute on function public.invite_admin(text, text, text) to authenticated;
