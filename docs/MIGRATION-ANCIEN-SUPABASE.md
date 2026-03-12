# Migrer les données d'un ancien Supabase vers le nouveau

- **Ancien projet** : `mfxskmfwongxxuqiubcz` — [Dashboard](https://supabase.com/dashboard/project/mfxskmfwongxxuqiubcz)
- **Nouveau projet** : `klrywioslvelkdvyzwbe`

---

## Commandes prêtes à l'emploi

Remplacer `MOT_DE_PASSE_ANCIEN` et `MOT_DE_PASSE_NOUVEAU` par les vrais mots de passe (Settings → Database).

### Étape 1 — Export depuis l'ancien (données uniquement)

```bash
pg_dump "postgresql://postgres:MOT_DE_PASSE_ANCIEN@db.mfxskmfwongxxuqiubcz.supabase.co:5432/postgres" --data-only --schema=public --no-owner --no-acl -f backup-savana-data-only.sql
```

### Étape 2 — Import dans le nouveau

1. Exécuter d'abord `docs/RUN-ALL-MIGRATIONS-SQL-EDITOR.sql` dans le SQL Editor du nouveau projet (si pas déjà fait)
2. Puis :

```bash
psql "postgresql://postgres:MOT_DE_PASSE_NOUVEAU@db.klrywioslvelkdvyzwbe.supabase.co:5432/postgres" -f backup-savana-data-only.sql
```

---

## Méthode 1 : pg_dump + psql (recommandé)

### Sur l'ancien projet

1. **Supabase** (ancien) → **Settings** → **Database**
2. Copier la **Connection string** (URI) — tu auras besoin du mot de passe
3. Dans un terminal :

```bash
# Export du schéma + données (sans les données auth si tu veux repartir de zéro côté users)
pg_dump "postgresql://postgres:MOT_DE_PASSE_ANCIEN@db.mfxskmfwongxxuqiubcz.supabase.co:5432/postgres" \
  --no-owner --no-acl \
  --schema=public \
  -f backup-savana.sql
```

Pour exporter **tout** (public + auth si besoin) :

```bash
pg_dump "postgresql://postgres:MOT_DE_PASSE_ANCIEN@db.mfxskmfwongxxuqiubcz.supabase.co:5432/postgres" \
  --no-owner --no-acl \
  -f backup-savana-complet.sql
```

### Sur le nouveau projet

1. S'assurer que le schéma existe (migrations déjà exécutées, ou exécuter `RUN-ALL-MIGRATIONS-SQL-EDITOR.sql` d'abord)
2. Importer les données :

```bash
psql "postgresql://postgres:MOT_DE_PASSE_NOUVEAU@db.klrywioslvelkdvyzwbe.supabase.co:5432/postgres" \
  -f backup-savana.sql
```

**Attention** : si tu importes le schéma complet, ça peut écraser des tables. Pour importer **uniquement les données** (tables déjà créées) :

```bash
pg_dump "postgresql://postgres:MOT_DE_PASSE_ANCIEN@db.mfxskmfwongxxuqiubcz.supabase.co:5432/postgres" \
  --data-only --schema=public \
  --no-owner --no-acl \
  -f backup-savana-data-only.sql
```

---

## Méthode 2 : Supabase Dashboard (export manuel)

### Export depuis l'ancien projet

1. **SQL Editor** → exécuter des requêtes `SELECT` et exporter en CSV
2. Ou utiliser **Table Editor** → sélectionner une table → **Export** (CSV)

Limite : table par table, plus fastidieux.

### Import dans le nouveau

1. **Table Editor** → choisir la table → **Insert** → coller les données
2. Ou **SQL Editor** → `COPY` ou `INSERT` à partir des CSV

---

## Méthode 3 : Backup Supabase (plans payants)

Si ton ancien projet est sur un plan Pro :

1. **Settings** → **Database** → **Backups**
2. Télécharger le backup
3. Contacter le support Supabase pour une restauration sur le nouveau projet (ou utiliser `pg_restore`)

---

## Recommandation

- **Schéma vide sur le nouveau** : exécuter `RUN-ALL-MIGRATIONS-SQL-EDITOR.sql` pour créer les tables
- **Données à migrer** : utiliser `pg_dump --data-only` sur l'ancien, puis `psql` sur le nouveau
- **Utilisateurs Auth** : les users dans `auth.users` ne sont pas dans le schéma `public`. Pour les migrer, il faut soit les recréer manuellement, soit exporter/importer le schéma `auth` (délicat, à éviter si possible)

