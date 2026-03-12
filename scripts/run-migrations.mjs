#!/usr/bin/env node
/**
 * Exécute toutes les migrations SAVANA sur le projet Supabase.
 * Utilise SUPABASE_DB_URL (ou DATABASE_URL) depuis .env.local
 *
 * Récupérer l'URL : Supabase → Settings → Database → Connection string → URI
 * Format : postgresql://postgres:[PASSWORD]@db.klrywioslvelkdvyzwbe.supabase.co:5432/postgres
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
const docsDir = join(__dirname, '..', 'docs');

// Charger .env.local
try {
  const envPath = join(process.cwd(), '.env.local');
  const content = readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) {
      const key = m[1].trim();
      const val = m[2].trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) process.env[key] = val;
    }
  }
} catch (_) {}

let dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
const hasPlaceholder = dbUrl && (dbUrl.includes('[YOUR-PASSWORD]') || dbUrl.includes('[PASSWORD]') || dbUrl.includes('[MOT_DE_PASSE]'));

if (!dbUrl || hasPlaceholder) {
  const password = process.env.SUPABASE_DB_PASSWORD;
  const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  const region = process.env.SUPABASE_DB_REGION || 'eu-west-1'; // ou us-east-1, ap-southeast-1
  if (password && projectRef) {
    const encoded = encodeURIComponent(password);
    // Essayer pooler (host différent) si direct échoue — contourne certains pare-feu
    dbUrl = process.env.SUPABASE_USE_POOLER
      ? `postgresql://postgres.${projectRef}:${encoded}@aws-0-${region}.pooler.supabase.com:5432/postgres`
      : `postgresql://postgres:${encoded}@db.${projectRef}.supabase.co:5432/postgres`;
  } else {
    console.error('\n❌ Connexion base de données manquante dans .env.local');
    console.error('   Option 1 — Mot de passe seul :');
    console.error('   SUPABASE_DB_PASSWORD=ton_mot_de_passe');
    console.error('   (VITE_SUPABASE_URL doit être défini)');
    console.error('');
    console.error('   Option 2 — URL complète :');
    console.error('   SUPABASE_DB_URL=postgresql://postgres:MOT_DE_PASSE@db.klrywioslvelkdvyzwbe.supabase.co:5432/postgres');
    console.error('');
    console.error('   Récupérer le mot de passe : Supabase → Settings → Database → Database password (ou Reset)\n');
    process.exit(1);
  }
}

const MIGRATIONS_ORDER = [
  'schema.sql',
  'migration-organisations-extended.sql',
  'migration-rls-read-own-profile.sql',
  'migration-rls-super-admin-organisations.sql',
  'migration-rls-admin-org-crud.sql',
  'migration-invitations.sql',
  'rls-invitation_codes.sql',
  'migration-admin-invitations.sql',
  'migration-coaching-requests.sql',
  'migration-super-admin-coaching-requests.sql',
  'migration-pedagogie.sql',
  'migration-modules-extensible.sql',
  'migration-learning-modules-promotion-formateur.sql',
  'migration-vision-client-learning-modules-mois.sql',
  'migration-learning-modules-admin-org-delete.sql',
  'migration-vision-client-incube-params.sql',
  'migration-vision-client-rdv-messages.sql',
  'migration-vision-client-toolbox.sql',
  'migration-storage-toolbox-documents.sql',
  'migration-storage-module-assets.sql',
  'migration-qcm-certification.sql',
  'migration-p1-p2-progression.sql',
  'migration-rls-admin-org-incubes.sql',
  'migration-rls-update-own-profile.sql',
  'migration-start-certification-exam.sql',
];

async function run() {
  const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    console.log('✅ Connexion à Supabase établie\n');

    for (let i = 0; i < MIGRATIONS_ORDER.length; i++) {
      const file = MIGRATIONS_ORDER[i];
      const filePath = join(docsDir, file);
      try {
        const sql = readFileSync(filePath, 'utf8');
        await client.query(sql);
        console.log(`  ${i + 1}/${MIGRATIONS_ORDER.length} ✓ ${file}`);
      } catch (err) {
        console.error(`  ${i + 1}/${MIGRATIONS_ORDER.length} ✗ ${file}`);
        console.error(`     ${err.message}`);
        throw err;
      }
    }

    console.log('\n✅ Toutes les migrations ont été exécutées avec succès.');
  } finally {
    await client.end();
  }
}

run().catch((err) => {
  console.error('\n❌ Erreur:', err.message);
  process.exit(1);
});
