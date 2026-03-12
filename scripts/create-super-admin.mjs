#!/usr/bin/env node
/**
 * Crée un compte Super Administrateur Platform.
 * Usage: node scripts/create-super-admin.mjs [email]
 * Exemple: node scripts/create-super-admin.mjs contact.cherif.pro@gmail.com
 *
 * Mot de passe: SUPER_ADMIN_PASSWORD dans .env.local, ou "SavanaAdmin2025!" par défaut.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

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

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const password = process.env.SUPABASE_ADMIN_PASSWORD || process.env.SUPER_ADMIN_PASSWORD || 'SavanaAdmin2025!';

const email = process.argv[2] || process.env.SUPER_ADMIN_EMAIL;
if (!email) {
  console.error('Usage: node scripts/create-super-admin.mjs <email>');
  console.error('Exemple: node scripts/create-super-admin.mjs contact.cherif.pro@gmail.com');
  process.exit(1);
}

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Erreur: VITE_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis dans .env.local');
  process.exit(1);
}

if (serviceRoleKey.length < 200) {
  console.error('Erreur: SUPABASE_SERVICE_ROLE_KEY semble tronquée (trop courte).');
  console.error('Copiez la clé complète depuis Supabase → Settings → API → service_role (Reveal)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const emailNorm = email.trim().toLowerCase();
  const fullName = emailNorm.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  console.log(`Création du Super Admin : ${emailNorm}\n`);

  try {
    const { data: user, error: authError } = await supabase.auth.admin.createUser({
      email: emailNorm,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (authError) {
      if (authError.message.includes('already been registered') || authError.message.includes('already exists')) {
        console.log('  Compte Auth existant. Liaison staff_users…');
        const { data: list } = await supabase.auth.admin.listUsers({ perPage: 1000 });
        const u = list?.users?.find((x) => x.email === emailNorm);
        if (!u) {
          console.error('  Utilisateur Auth introuvable. Supprimez-le dans Supabase Dashboard puis relancez.');
          process.exit(1);
        }
        const { error: staffErr } = await supabase.from('staff_users').upsert(
          {
            auth_user_id: u.id,
            full_name: fullName,
            email: emailNorm,
            role: 'SUPER_ADMIN',
            organisation_id: null,
          },
          { onConflict: 'email' }
        );
        if (staffErr) {
          console.error('  Erreur staff_users:', staffErr.message);
          process.exit(1);
        }
        console.log('  ✓ Compte Super Admin mis à jour.');
      } else {
        throw authError;
      }
    } else {
      const { error: staffErr } = await supabase.from('staff_users').upsert(
        {
          auth_user_id: user.user.id,
          full_name: fullName,
          email: emailNorm,
          role: 'SUPER_ADMIN',
          organisation_id: null,
        },
        { onConflict: 'email' }
      );
      if (staffErr) {
        console.error('  Erreur staff_users:', staffErr.message);
        process.exit(1);
      }
      console.log('  ✓ Compte Super Admin créé.');
    }

    console.log('\n--- Connexion ---');
    console.log(`  Email    : ${emailNorm}`);
    console.log(`  Mot de passe : ${password}`);
    console.log('\nConnectez-vous sur http://localhost:5173/login');
    console.log('Pensez à changer le mot de passe après la première connexion.');
  } catch (err) {
    console.error('  ✗ Erreur:', err.message);
    if (err.message.includes('Invalid API key') || err.message.includes('invalid api key')) {
      console.error('\n  → Vérifie SUPABASE_SERVICE_ROLE_KEY dans .env.local');
      console.error('  → Supabase → Projet → Settings → API → service_role (Reveal) → Copier');
      console.error('  → Utilise la clé service_role, pas la clé anon\n');
    }
    process.exit(1);
  }
}

main();
