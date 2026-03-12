# Migrations via Supabase SQL Editor

Si `npm run db:migrate` échoue (réseau, DNS), exécutez les migrations directement dans Supabase.

## Méthode

1. **Générer le fichier** (une fois) :
   ```bash
   node scripts/generate-full-migration.mjs
   ```

2. **Ouvrir** `docs/RUN-ALL-MIGRATIONS-SQL-EDITOR.sql`

3. **Supabase** → **SQL Editor** → **New query**

4. **Copier-coller** tout le contenu du fichier

5. **Run** (ou Ctrl+Enter)

6. Si erreur "query too long" : exécuter par blocs (sélectionner une partie, Run, puis la suite)

## Après les migrations

1. Créer l'utilisateur Auth : **Authentication** → **Users** → **Add user** (contact.cherif.pro@gmail.com)
2. Exécuter `docs/CREER-SUPER-ADMIN-MANUAL.sql` dans le SQL Editor
3. Se connecter sur http://localhost:5173/login
