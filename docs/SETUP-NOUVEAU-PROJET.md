# Setup complet du nouveau projet Supabase (sans intervention manuelle)

## Problème

La connexion directe Postgres (`db.xxx.supabase.co:5432`) est bloquée depuis ton réseau (DNS/réseau). L’API Management renvoie 403 (token sans scope `database:write`).

## Solution : utiliser la chaîne de connexion du pooler

1. Ouvre **Supabase** → ton projet **klrywioslvelkdvyzwbe** → **Connect** (ou Settings → Database).
2. Choisis **Session mode** ou **Transaction mode**.
3. Copie la **Connection string** complète (URI).
4. Dans `.env.local`, ajoute ou remplace :

```env
SUPABASE_DB_URL=postgresql://postgres.klrywioslvelkdvyzwbe:MOT_DE_PASSE@aws-0-XX-XXXX-X.pooler.supabase.com:5432/postgres
```

(Remplace `MOT_DE_PASSE` par le mot de passe de la base.)

5. Lance :

```bash
npm run db:migrate
npm run create:super-admin contact.cherif.pro@gmail.com
```

## Alternative : exécuter le SQL dans le Dashboard

Si le pooler ne fonctionne pas non plus :

1. Ouvre **Supabase** → **SQL Editor**.
2. Copie tout le contenu de `docs/RUN-ALL-MIGRATIONS-SQL-EDITOR.sql`.
3. Colle et exécute.
4. Crée l’utilisateur dans **Authentication** → **Users** → **Add user** :
   - Email : `contact.cherif.pro@gmail.com`
   - Mot de passe : `SavanaAdmin2025!` (ou autre)
5. Relance :

```bash
npm run create:super-admin contact.cherif.pro@gmail.com
```

## Token Management API (optionnel)

Pour utiliser `npm run setup:new-project` (migrations via HTTPS) :

1. Crée un token : https://supabase.com/dashboard/account/tokens  
2. Coche **database:write** (ou tous les scopes database).  
3. Dans `.env.local` :

```env
SUPABASE_ACCESS_TOKEN=sbp_xxx...
```

4. Lance :

```bash
npm run setup:new-project
```
