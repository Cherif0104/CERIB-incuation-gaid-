#!/usr/bin/env node
/**
 * Génère docs/RUN-ALL-MIGRATIONS-SQL-EDITOR.sql avec toutes les migrations concaténées.
 * À exécuter dans Supabase SQL Editor si npm run db:migrate échoue (réseau).
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const docsDir = join(__dirname, '..', 'docs');

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

let out = `-- SAVANA : Toutes les migrations (à exécuter dans Supabase SQL Editor)
-- Généré par scripts/generate-full-migration.mjs
-- Exécutez ce fichier en une seule fois ou par blocs si trop long.

`;

for (const file of MIGRATIONS_ORDER) {
  const path = join(docsDir, file);
  try {
    const sql = readFileSync(path, 'utf8');
    out += `\n-- ========== ${file} ==========\n`;
    out += sql;
    out += '\n';
  } catch (e) {
    console.error(`Fichier manquant: ${file}`);
  }
}

const outPath = join(docsDir, 'RUN-ALL-MIGRATIONS-SQL-EDITOR.sql');
writeFileSync(outPath, out, 'utf8');
console.log(`✓ Généré: ${outPath}`);
console.log('Copiez le contenu dans Supabase → SQL Editor → Run');
