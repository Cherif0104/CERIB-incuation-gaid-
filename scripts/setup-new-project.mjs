#!/usr/bin/env node
/**
 * Setup complet du nouveau projet Supabase : migrations + Super Admin.
 * Utilise l'API Management Supabase (HTTPS) pour contourner les blocages réseau sur le port 5432.
 *
 * Prérequis : SUPABASE_ACCESS_TOKEN dans .env.local
 * Créer un token : https://supabase.com/dashboard/account/tokens
 */

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
loadEnv(process.cwd(), '.env');

let accessToken = process.env.SUPABASE_ACCESS_TOKEN || '';
// Extraire le token si la valeur contient une assignation PowerShell ou autre format
const sbpMatch = accessToken.match(/sbp_[a-f0-9]+/);
if (sbpMatch) accessToken = sbpMatch[0];
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const projectRef = supabaseUrl?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

if (!accessToken || accessToken.length < 20) {
  console.error('\n❌ SUPABASE_ACCESS_TOKEN manquant ou invalide dans .env.local');
  console.error('   Crée un token : https://supabase.com/dashboard/account/tokens');
  console.error('   Puis ajoute : SUPABASE_ACCESS_TOKEN=sbp_xxx...\n');
  process.exit(1);
}

if (!projectRef) {
  console.error('\n❌ VITE_SUPABASE_URL manquant dans .env.local\n');
  process.exit(1);
}

const MIGRATION_FILE = join(projectRoot, 'docs', 'RUN-ALL-MIGRATIONS-SQL-EDITOR.sql');

async function runQuery(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json();
}

async function main() {
  console.log('🚀 Setup nouveau projet Supabase\n');
  console.log(`   Projet : ${projectRef}`);
  console.log('');

  // 1. Migrations via Management API
  console.log('1️⃣  Exécution des migrations...');
  const sql = readFileSync(MIGRATION_FILE, 'utf8');
  // Nettoyer les commentaires et lignes vides pour réduire la taille
  const cleanSql = sql
    .split('\n')
    .filter((line) => {
      const t = line.trim();
      return t && !t.startsWith('--');
    })
    .join('\n');

  try {
    await runQuery(cleanSql);
    console.log('   ✓ Migrations exécutées\n');
  } catch (err) {
    console.error('   ✗ Erreur migrations:', err.message);
    if (err.message.includes('401') || err.message.includes('403')) {
      console.error('\n   Vérifie que SUPABASE_ACCESS_TOKEN est valide et a les droits database:write');
      console.error('   https://supabase.com/dashboard/account/tokens\n');
    }
    process.exit(1);
  }

  // 2. Super Admin via script existant
  console.log('2️⃣  Création du Super Admin...');
  const { spawn } = await import('child_process');
  const child = spawn('node', [join(__dirname, 'create-super-admin.mjs'), 'contact.cherif.pro@gmail.com'], {
    stdio: 'inherit',
    env: { ...process.env },
    cwd: projectRoot,
  });

  const code = await new Promise((resolve) => child.on('close', resolve));
  if (code !== 0) {
    process.exit(code);
  }

  console.log('\n✅ Setup terminé. Connecte-toi sur http://localhost:5173/login');
}

main().catch((err) => {
  console.error('\n❌', err.message);
  process.exit(1);
});
