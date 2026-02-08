import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendAccountCreatedEmail } from '../_shared/resend.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function getUserIdFromJwt(token: string | null): string | null {
  if (!token || !token.startsWith('Bearer ')) return null;
  const jwt = token.slice(7);
  const parts = jwt.split('.');
  if (parts.length !== 3) return null;
  try {
    const payload = JSON.parse(atob(parts[1]));
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

function randomPassword(length = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const arr = new Uint8Array(length);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => chars[b % chars.length]).join('');
}

const ROLES = ['ADMIN_ORG', 'COACH', 'CERTIFICATEUR', 'INCUBE'] as const;
type Role = (typeof ROLES)[number];

interface Body {
  email?: string;
  full_name?: string;
  password?: string;
  role?: string;
  organisation_id?: string | null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    const userId = getUserIdFromJwt(authHeader);
    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Non autorisé' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: caller } = await supabase
      .from('staff_users')
      .select('role, organisation_id')
      .eq('auth_user_id', userId)
      .single();

    if (!caller) {
      return new Response(
        JSON.stringify({ success: false, error: 'Accès réservé au staff' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = (await req.json().catch(() => ({}))) as Body;
    const email = (body.email ?? '').trim().toLowerCase();
    const full_name = (body.full_name ?? '').trim() || email;
    const role = body.role as Role | undefined;
    const organisation_id = body.organisation_id ?? null;

    if (!email) {
      return new Response(
        JSON.stringify({ success: false, error: 'E-mail requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (!role || !ROLES.includes(role)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Rôle invalide (ADMIN_ORG, COACH, CERTIFICATEUR, INCUBE)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const isSuperAdmin = caller.role === 'SUPER_ADMIN';
    const isAdminOrg = caller.role === 'ADMIN_ORG';
    const callerOrgId = caller.organisation_id ?? null;

    if (role === 'ADMIN_ORG') {
      if (!isSuperAdmin || !organisation_id) {
        return new Response(
          JSON.stringify({ success: false, error: 'Seul un Super Admin peut créer un compte Admin Org avec organisation_id' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else if (role === 'CERTIFICATEUR' && organisation_id === null) {
      if (!isSuperAdmin) {
        return new Response(
          JSON.stringify({ success: false, error: 'Seul un Super Admin peut créer un certificateur sans organisation' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      if (!isSuperAdmin && !(isAdminOrg && callerOrgId === organisation_id)) {
        return new Response(
          JSON.stringify({ success: false, error: 'Droits insuffisants pour créer ce compte' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (role !== 'INCUBE' && !organisation_id) {
        return new Response(
          JSON.stringify({ success: false, error: 'organisation_id requis pour ce rôle' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (role === 'INCUBE' && !organisation_id) {
        return new Response(
          JSON.stringify({ success: false, error: 'organisation_id requis pour un incubé' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const temporary_password = (body.password && body.password.trim().length >= 6)
      ? body.password.trim()
      : randomPassword();

    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: temporary_password,
      email_confirm: true,
      user_metadata: { full_name },
    });

    if (authError) {
      return new Response(
        JSON.stringify({ success: false, error: authError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authUserId = authUser.user.id;

    if (role === 'INCUBE') {
      const { error: incErr } = await supabase.from('incubes').insert({
        auth_user_id: authUserId,
        full_name,
        email,
        organisation_id: organisation_id!,
        current_parcours: 'P1',
        global_status: 'P1_EN_COURS',
      });
      if (incErr) {
        await supabase.auth.admin.deleteUser(authUserId);
        return new Response(
          JSON.stringify({ success: false, error: incErr.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      const { error: staffErr } = await supabase.from('staff_users').insert({
        auth_user_id: authUserId,
        full_name,
        email,
        role,
        organisation_id: organisation_id ?? null,
      });
      if (staffErr) {
        await supabase.auth.admin.deleteUser(authUserId);
        return new Response(
          JSON.stringify({ success: false, error: staffErr.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (role === 'ADMIN_ORG' && organisation_id) {
        await supabase
          .from('organisations')
          .update({ main_admin_user_id: authUserId })
          .eq('id', organisation_id);
      }
    }

    const loginUrl = Deno.env.get('PLATFORM_URL') || 'https://votre-app.vercel.app';
    const emailResult = await sendAccountCreatedEmail({
      to: email,
      full_name,
      temporary_password,
      login_url: loginUrl,
    });
    if (!emailResult.ok) {
      console.error('create-platform-user: email send failed', emailResult.error);
    }

    return new Response(
      JSON.stringify({
        success: true,
        temporary_password,
        email_sent: emailResult.ok,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('create-platform-user', err);
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : 'Erreur serveur' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
