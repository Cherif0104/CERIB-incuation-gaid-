import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase: VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY manquant. Vérifiez .env.local.');
}

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder');

/**
 * Vérifie que la connexion Supabase répond (auth).
 * À appeler au démarrage pour confirmer que le projet est bien connecté.
 */
export async function checkSupabaseConnection() {
  try {
    const { error } = await supabase.auth.getSession();
    return { ok: !error, error: error?.message ?? null };
  } catch (err) {
    return { ok: false, error: err?.message ?? 'Erreur inconnue' };
  }
}

