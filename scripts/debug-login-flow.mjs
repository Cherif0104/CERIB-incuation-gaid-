#!/usr/bin/env node
/**
 * Simule le flux de connexion côté client pour diagnostiquer.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

function loadEnv(dir, fileName) {
  const path = join(dir, fileName);
  if (!existsSync(path)) return;
  const content = readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
  for (const line of content.split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) {
      const key = m[1].trim();
      const val = m[2].trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

loadEnv(process.cwd(), '.env.local');
loadEnv(projectRoot, '.env.local');

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
const email = process.argv[2] || 'myimmogis@gmail.com';
const password = process.argv[3] || 'XFct2KfvSu2m';

if (!supabaseUrl || !anonKey) {
  console.error('Erreur: VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY requis');
  process.exit(1);
}

// Client comme le navigateur (anon key, pas service role)
const supabase = createClient(supabaseUrl, anonKey);

async function main() {
  console.log('1. Connexion avec', email, '...');
  const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (signInErr) {
    console.error('   ERREUR signIn:', signInErr.message);
    process.exit(1);
  }
  console.log('   OK - session obtenue');

  const session = signInData.session;
  if (!session) {
    console.error('   Pas de session');
    process.exit(1);
  }

  console.log('2. Requête staff_users pour auth_user_id =', session.user.id);
  const { data: staffProfile, error: staffErr } = await supabase
    .from('staff_users')
    .select('*')
    .eq('auth_user_id', session.user.id)
    .maybeSingle();
  console.log('   staff_profile:', staffProfile ? 'trouvé' : 'null', staffErr ? '| erreur:' + staffErr.message : '');

  console.log('3. Requête incubes pour auth_user_id =', session.user.id);
  const { data: incubeProfile, error: incubeErr } = await supabase
    .from('incubes')
    .select('*')
    .eq('auth_user_id', session.user.id)
    .maybeSingle();
  console.log('   incube_profile:', incubeProfile ? 'trouvé' : 'null', incubeErr ? '| erreur:' + incubeErr.message : '');

  if (!incubeProfile && !staffProfile) {
    console.log('\n>>> PROBLÈME: Aucun profil trouvé après connexion (RLS ou ligne manquante)');
    process.exit(1);
  }
  console.log('\n>>> Profil OK, le flux devrait fonctionner.');
}

main();
