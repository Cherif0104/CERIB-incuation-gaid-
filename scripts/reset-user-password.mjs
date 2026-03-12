#!/usr/bin/env node
/**
 * Réinitialise le mot de passe d'un utilisateur (incubé, coach, etc.) et confirme l'email si nécessaire.
 * Usage: node scripts/reset-user-password.mjs <email> [nouveau_mot_de_passe]
 * Exemple: node scripts/reset-user-password.mjs incube@test.com MonMotDePasse123
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
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.argv[2];
const newPassword = process.argv[3] || 'Savana2025!';

if (!email) {
  console.error('Usage: node scripts/reset-user-password.mjs <email> [nouveau_mot_de_passe]');
  console.error('Exemple: node scripts/reset-user-password.mjs incube@test.com MonMotDePasse123');
  process.exit(1);
}

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Erreur: VITE_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis dans .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const { data: list } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const user = list?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!user) {
    console.error('Utilisateur non trouvé:', email);
    process.exit(1);
  }

  const updates = { password: newPassword };
  if (!user.email_confirmed_at) {
    updates.email_confirm = true;
    console.log('Email non confirmé détecté — confirmation appliquée.');
  }

  const { error } = await supabase.auth.admin.updateUserById(user.id, updates);
  if (error) {
    console.error('Erreur:', error.message);
    process.exit(1);
  }

  console.log('✓ Mot de passe mis à jour pour', email);
  console.log('  Nouveau mot de passe:', newPassword);
  console.log('\nConnexion sur http://localhost:5173/login');
}

main();
