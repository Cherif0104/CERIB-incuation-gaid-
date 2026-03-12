#!/usr/bin/env node
/** Vérifie si un incubé existe pour un email donné */
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
const email = process.argv[2] || 'myimmogis@gmail.com';

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Erreur: .env.local requis');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const { data: authUsers } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const authUser = authUsers?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!authUser) {
    console.log('Auth user non trouvé:', email);
    return;
  }
  console.log('Auth user:', authUser.id, authUser.email);

  const { data: incube, error } = await supabase
    .from('incubes')
    .select('*')
    .eq('auth_user_id', authUser.id)
    .maybeSingle();

  if (error) {
    console.error('Erreur incubes:', error);
    return;
  }
  if (!incube) {
    console.log('Aucune ligne incubes pour auth_user_id:', authUser.id);
    console.log('→ Création de la ligne incubes nécessaire.');
    return;
  }
  console.log('Incubé trouvé:', incube.id, incube.full_name, incube.organisation_id);
}

main();
