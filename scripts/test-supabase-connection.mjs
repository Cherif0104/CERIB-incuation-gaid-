/**
 * Test de connexion Supabase (Auth + API REST).
 * Utilise VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY depuis .env.local ou .env.
 *
 * Usage : node scripts/test-supabase-connection.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const scriptRoot = join(__dirname, '..');
const cwd = process.cwd();

function loadEnvFile(dir, fileName) {
  const path = join(dir, fileName);
  if (!existsSync(path)) return false;
  const content = readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
  content.split('\n').forEach((line) => {
    const trimmed = line.trim();
    const eq = trimmed.indexOf('=');
    if (eq <= 0) return;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
      val = val.slice(1, -1);
    if (!process.env[key]) process.env[key] = val;
  });
  return true;
}

if (!loadEnvFile(cwd, '.env.local') && cwd !== scriptRoot) loadEnvFile(scriptRoot, '.env.local');
loadEnvFile(cwd, '.env');
loadEnvFile(scriptRoot, '.env');

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !anonKey) {
  console.error('Erreur : variables manquantes.');
  console.error('  VITE_SUPABASE_URL (ou SUPABASE_URL) :', supabaseUrl ? 'défini' : 'MANQUANT');
  console.error('  VITE_SUPABASE_ANON_KEY (ou SUPABASE_ANON_KEY) :', anonKey ? 'défini' : 'MANQUANT');
  console.error('\nAssure-toi que .env.local contient ces variables (voir docs/deploiement-vercel.md).');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, anonKey);

async function main() {
  console.log('Test de connexion Supabase…\n');
  console.log('  URL :', supabaseUrl);

  let ok = true;

  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('  Auth (getSession) : ERREUR', error.message);
      ok = false;
    } else {
      console.log('  Auth (getSession) : OK');
    }
  } catch (err) {
    console.error('  Auth : Exception', err.message);
    ok = false;
  }

  try {
    const { data, error } = await supabase.from('organisations').select('id').limit(1);
    if (error) {
      console.error('  API REST (organisations) : ERREUR', error.message);
      ok = false;
    } else {
      console.log('  API REST (organisations) : OK');
    }
  } catch (err) {
    console.error('  API REST : Exception', err.message);
    ok = false;
  }

  console.log('');
  if (ok) {
    console.log('Résultat : connexion Supabase OK.');
    process.exit(0);
  } else {
    console.log('Résultat : au moins un test a échoué.');
    process.exit(1);
  }
}

main();
