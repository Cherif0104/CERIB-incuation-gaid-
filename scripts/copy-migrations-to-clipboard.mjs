#!/usr/bin/env node
/**
 * Copie le SQL des migrations dans le presse-papiers.
 * Ensuite : Supabase → SQL Editor → Coller (Ctrl+V) → Run
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sqlPath = join(__dirname, '..', 'docs', 'RUN-ALL-MIGRATIONS-SQL-EDITOR.sql');
const sql = readFileSync(sqlPath, 'utf8');

try {
  if (process.platform === 'win32') {
    execSync('clip', { input: sql, stdio: ['pipe', 'ignore', 'ignore'] });
  } else if (process.platform === 'darwin') {
    execSync('pbcopy', { input: sql, stdio: ['pipe', 'ignore', 'ignore'] });
  } else {
    execSync('xclip -selection clipboard', { input: sql, stdio: ['pipe', 'ignore', 'ignore'] });
  }
  console.log('✅ SQL copié dans le presse-papiers.\n');
  console.log('1. Ouvre https://supabase.com/dashboard/project/klrywioslvelkdvyzwbe/sql/new');
  console.log('2. Ctrl+V pour coller');
  console.log('3. Run (ou Ctrl+Enter)\n');
} catch (err) {
  console.error('❌ Impossible de copier. Copie manuellement le fichier :');
  console.error('   docs/RUN-ALL-MIGRATIONS-SQL-EDITOR.sql\n');
}
