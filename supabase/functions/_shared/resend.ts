/**
 * Send "account created" email via Resend API.
 * Does not throw; returns { ok: boolean, error?: string }.
 */
export interface SendAccountCreatedParams {
  to: string;
  full_name: string;
  temporary_password: string;
  login_url: string;
}

const RESEND_API = 'https://api.resend.com/emails';

export async function sendAccountCreatedEmail(params: SendAccountCreatedParams): Promise<{ ok: boolean; error?: string }> {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  if (!apiKey) {
    return { ok: false, error: 'RESEND_API_KEY not set' };
  }

  const from = Deno.env.get('RESEND_FROM') ?? 'CERIP Incubation <onboarding@resend.dev>';
  const { to, full_name, temporary_password, login_url } = params;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: sans-serif; line-height: 1.5; color: #333;">
  <p>Bonjour ${escapeHtml(full_name)},</p>
  <p>Un compte a été créé pour vous sur la plateforme CERIP Incubation.</p>
  <p><strong>E-mail de connexion :</strong> ${escapeHtml(to)}</p>
  <p><strong>Mot de passe temporaire :</strong> ${escapeHtml(temporary_password)}</p>
  <p>Nous vous recommandons de changer ce mot de passe après votre première connexion (Profil).</p>
  <p><a href="${escapeHtml(login_url)}" style="display: inline-block; margin-top: 0.5rem; padding: 0.5rem 1rem; background: #0d5c2e; color: #fff; text-decoration: none; border-radius: 4px;">Se connecter</a></p>
  <p style="margin-top: 1.5rem; font-size: 0.9rem; color: #666;">Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail.</p>
</body>
</html>`;

  try {
    const res = await fetch(RESEND_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: 'Votre compte CERIP Incubation a été créé',
        html,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      return { ok: false, error: `Resend ${res.status}: ${body}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
