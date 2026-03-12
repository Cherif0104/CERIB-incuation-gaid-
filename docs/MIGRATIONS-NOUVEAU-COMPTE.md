# Migrations sur un nouveau compte Supabase

Pour initialiser le projet SAVANA sur un nouveau projet Supabase (ex. klrywioslvelkdvyzwbe).

## 1. Récupérer le mot de passe de la base

1. Supabase Dashboard → **Settings** → **Database**
2. Section **Database password** : utilise le mot de passe défini à la création du projet, ou **Reset database password** pour en générer un nouveau
3. Copie le mot de passe (tu en auras besoin une seule fois)

## 2. Configurer `.env.local`

Ajoute ou modifie dans `.env.local` :

```env
SUPABASE_DB_URL=postgresql://postgres:TON_MOT_DE_PASSE@db.klrywioslvelkdvyzwbe.supabase.co:5432/postgres
```

Remplace `TON_MOT_DE_PASSE` par le mot de passe de l’étape 1.

## 3. Exécuter les migrations

```bash
npm run db:migrate
```

Exécute les 24 migrations dans l’ordre (schéma, RLS, invitations, pédagogie, certification, etc.).

## 4. Exécuter les seeds (données initiales)

```bash
npm run db:seed
```

Crée :
- 2 organisations (cerip-dakar, incubateur-thies)
- 3 promotions
- 2 codes d’invitation (cerip2025, thies25)
- 4 incubés (sans compte Auth — inscription via code)
- 3 modules pédagogiques + 2 questions de quiz
- 2 questions d’examen de certification

**En production** : les seeds de démo sont optionnels. La prod peut être initialisée via l'UI Super Admin. Pour un seed minimal : exécuter manuellement `docs/seed-prod.sql` dans le SQL Editor Supabase.

## 5. Tout en une commande

```bash
npm run db:setup
```

Exécute migrations + seeds.

## 6. Créer les comptes de test (optionnel)

```bash
npm run seed:dev
```

Crée les utilisateurs Auth et les lignes staff/incubés pour tester chaque rôle (voir `docs/comptes-dev.md`).

---

## En cas d’erreur

- **Connexion refusée** : vérifie que `SUPABASE_DB_URL` est correct et que le mot de passe n’a pas d’espaces ou de caractères spéciaux non échappés
- **Erreur sur une migration** : note le fichier et le message, certaines migrations peuvent déjà être appliquées partiellement
- **RLS bloque** : les migrations incluent les politiques RLS basées sur `staff_users.role` et `auth.uid()`
