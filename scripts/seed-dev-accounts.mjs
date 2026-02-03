/**
 * Crée les comptes de test (un par rôle) pour la phase de développement.
 * Mot de passe commun : CeripDev2025!
 *
 * Utilisation :
 *   1. Ajoute SUPABASE_SERVICE_ROLE_KEY dans .env.local (récupérable dans Supabase → Settings → API).
 *   2. node scripts/seed-dev-accounts.mjs
 *
 * Comptes créés :
 *   - superadmin@cerip-dev.sn  → Super Admin
 *   - admin@cerip-dev.sn      → Admin Org (cerip-dakar)
 *   - coach@cerip-dev.sn      → Coach (cerip-dakar)
 *   - certificateur@cerip-dev.sn → Certificateur
 *   - incube@cerip-dev.sn     → Incubé (cerip-dakar)
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
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Erreur : variables manquantes dans .env.local (ou .env)');
  if (!supabaseUrl) console.error('  → VITE_SUPABASE_URL ou SUPABASE_URL');
  if (!serviceRoleKey) console.error('  → SUPABASE_SERVICE_ROLE_KEY (Supabase → Settings → API → service_role, clé secrète)');
  console.error('\nAjoute la ligne suivante dans .env.local (sans la committer) :');
  console.error('  SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...ta_cle_service_role...');
  process.exit(1);
}

const PASSWORD = 'CeripDev2025!';

const accounts = [
  { email: 'superadmin@cerip-dev.sn', fullName: 'Super Admin Dev', role: 'SUPER_ADMIN', organisationId: null },
  { email: 'admin@cerip-dev.sn', fullName: 'Admin Org Dev', role: 'ADMIN_ORG', organisationId: 'cerip-dakar' },
  { email: 'coach@cerip-dev.sn', fullName: 'Coach Dev', role: 'COACH', organisationId: 'cerip-dakar' },
  { email: 'certificateur@cerip-dev.sn', fullName: 'Certificateur Dev', role: 'CERTIFICATEUR', organisationId: 'cerip-dakar' },
  { email: 'incube@cerip-dev.sn', fullName: 'Incubé Dev', role: 'INCUBE', organisationId: 'cerip-dakar' },
];

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log('Création des comptes de test…\n');

  for (const acc of accounts) {
    try {
      const { data: user, error: authError } = await supabase.auth.admin.createUser({
        email: acc.email,
        password: PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: acc.fullName },
      });

      if (authError) {
        if (authError.message.includes('already been registered') || authError.message.includes('already exists')) {
          console.log(`  ${acc.email} existe déjà (Auth). Liaison staff/incube…`);
          const { data: existing } = await supabase.auth.admin.listUsers({ perPage: 1000 });
          const u = existing?.users?.find((x) => x.email === acc.email);
          if (!u) {
            console.error(`    Utilisateur Auth introuvable pour ${acc.email}. Supprime-le dans le Dashboard puis relance.`);
            continue;
          }
          if (acc.role !== 'INCUBE') {
            await supabase.from('staff_users').upsert(
              {
                auth_user_id: u.id,
                full_name: acc.fullName,
                email: acc.email,
                role: acc.role,
                organisation_id: acc.organisationId,
              },
              { onConflict: 'email' }
            );
          }
          if (acc.role === 'INCUBE') {
            await supabase.from('incubes').upsert(
              {
                auth_user_id: u.id,
                full_name: acc.fullName,
                email: acc.email,
                organisation_id: acc.organisationId,
                current_parcours: 'P1',
                global_status: 'P1_EN_COURS',
              },
              { onConflict: 'email' }
            );
          }
          continue;
        }
        throw authError;
      }

      if (acc.role === 'INCUBE') {
        const { error: incErr } = await supabase.from('incubes').upsert(
          {
            auth_user_id: user.user.id,
            full_name: acc.fullName,
            email: acc.email,
            organisation_id: acc.organisationId,
            current_parcours: 'P1',
            global_status: 'P1_EN_COURS',
          },
          { onConflict: 'email' }
        );
        if (incErr) console.error(`    Incubes: ${incErr.message}`);
        else console.log(`  ✓ ${acc.email} (Incubé)`);
      } else {
        const { error: staffErr } = await supabase.from('staff_users').upsert(
          {
            auth_user_id: user.user.id,
            full_name: acc.fullName,
            email: acc.email,
            role: acc.role,
            organisation_id: acc.organisationId,
          },
          { onConflict: 'email' }
        );
        if (staffErr) console.error(`    Staff: ${staffErr.message}`);
        else console.log(`  ✓ ${acc.email} (${acc.role})`);
      }
    } catch (err) {
      console.error(`  ✗ ${acc.email}: ${err.message}`);
    }
  }

  console.log('\n--- Comptes de test (phase dev) ---');
  console.log('Mot de passe commun : ' + PASSWORD);
  console.log('');
  accounts.forEach((a) => console.log(`  ${a.email}`));
  console.log('\nTu peux te connecter avec n’importe quel compte pour tester.');
}

main();
