#!/usr/bin/env node
/**
 * Applique le correctif RLS pour permettre aux incubés/staff de lire leur propre profil après login.
 * À exécuter si la connexion réussit mais l'utilisateur reste sur la page login.
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

function loadEnv(dir, fileName) {
  const path = join(dir, fileName);
  try {
    const content = readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
    for (const line of content.split('\n')) {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (m) {
        const key = m[1].trim();
        const val = m[2].trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) process.env[key] = val;
      }
    }
  } catch (_) {}
}

loadEnv(process.cwd(), '.env.local');
loadEnv(projectRoot, '.env.local');

const password = process.env.SUPABASE_DB_PASSWORD;
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

if (!password || !projectRef) {
  console.error('Erreur: SUPABASE_DB_PASSWORD et VITE_SUPABASE_URL requis dans .env.local');
  process.exit(1);
}

const dbUrl = process.env.SUPABASE_DB_URL
  || `postgresql://postgres:${encodeURIComponent(password)}@db.${projectRef}.supabase.co:5432/postgres`;

const SQL = `
-- Correctif RLS : permettre à tout utilisateur authentifié de lire sa propre ligne
drop policy if exists staff_users_select_own on public.staff_users;
create policy staff_users_select_own
  on public.staff_users
  for select
  to authenticated
  using (auth_user_id = auth.uid());

drop policy if exists incubes_select_own on public.incubes;
create policy incubes_select_own
  on public.incubes
  for select
  to authenticated
  using (auth_user_id = auth.uid());
`;

async function main() {
  const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    await client.query(SQL);
    console.log('✓ Politiques RLS staff_users_select_own et incubes_select_own appliquées.');
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('Erreur:', err.message);
  process.exit(1);
});
