#!/usr/bin/env node
/**
 * Réinitialise le mot de passe du Super Admin.
 * Usage: node scripts/reset-super-admin-password.mjs [email] [nouveau_mot_de_passe]
 * Exemple: node scripts/reset-super-admin-password.mjs contact.cherif.pro@gmail.com SavanaAdmin2025!
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
const email = process.argv[2] || process.env.SUPER_ADMIN_EMAIL;
const newPassword = process.argv[3] || process.env.SUPER_ADMIN_PASSWORD || 'SavanaAdmin2025!';

if (!email) {
  console.error('Usage: node scripts/reset-super-admin-password.mjs <email> [nouveau_mot_de_passe]');
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

  const { error } = await supabase.auth.admin.updateUserById(user.id, { password: newPassword });
  if (error) {
    console.error('Erreur:', error.message);
    process.exit(1);
  }

  console.log('✓ Mot de passe mis à jour pour', email);
  console.log('  Nouveau mot de passe:', newPassword);
  console.log('\nConnecte-toi sur http://localhost:5173/login');
}

main();
