#!/usr/bin/env node
/**
 * Exécute les seeds SAVANA (données initiales) sur le projet Supabase.
 * À lancer après run-migrations.
 * Utilise SUPABASE_DB_URL (ou DATABASE_URL) depuis .env.local
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
  if (password && projectRef) {
    const encoded = encodeURIComponent(password);
    dbUrl = `postgresql://postgres:${encoded}@db.${projectRef}.supabase.co:5432/postgres`;
  } else {
    console.error('\n❌ SUPABASE_DB_URL ou SUPABASE_DB_PASSWORD manquant dans .env.local\n');
    process.exit(1);
  }
}

const SEEDS = ['seed.sql', 'seed-learning-modules-cerip.sql'];

async function run() {
  const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    console.log('✅ Connexion à Supabase établie\n');

    for (let i = 0; i < SEEDS.length; i++) {
      const file = SEEDS[i];
      const filePath = join(docsDir, file);
      try {
        const sql = readFileSync(filePath, 'utf8');
        await client.query(sql);
        console.log(`  ${i + 1}/${SEEDS.length} ✓ ${file}`);
      } catch (err) {
        console.error(`  ${i + 1}/${SEEDS.length} ✗ ${file}`);
        console.error(`     ${err.message}`);
        throw err;
      }
    }

    console.log('\n✅ Tous les seeds ont été exécutés avec succès.');
  } finally {
    await client.end();
  }
}

run().catch((err) => {
  console.error('\n❌ Erreur:', err.message);
  process.exit(1);
});
