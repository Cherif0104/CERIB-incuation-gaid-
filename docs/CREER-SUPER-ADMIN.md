# Créer un compte Super Administrateur

Après un changement de base de données ou une nouvelle installation, créez le premier compte Super Admin.

---

## Méthode 1 : Script npm (recommandé)

```bash
npm run create:super-admin -- contact.cherif.pro@gmail.com
```

**Prérequis** : `SUPABASE_SERVICE_ROLE_KEY` dans `.env.local` (Supabase → Settings → API → service_role, clé complète sans troncature).

---

## Méthode 2 : Manuel (si "Invalid API key")

### Étape 1 — Créer l'utilisateur Auth

1. **Supabase Dashboard** → **Authentication** → **Users**
2. **Add user** → **Create new user**
3. Email : `contact.cherif.pro@gmail.com`
4. Password : (votre mot de passe)
5. Cocher **Auto Confirm User**
6. **Create user**

### Étape 2 — Lier le rôle Super Admin

1. **Supabase Dashboard** → **SQL Editor**
2. Coller et exécuter le contenu de `docs/CREER-SUPER-ADMIN-MANUAL.sql`

### Étape 3 — Connexion

Connectez-vous sur http://localhost:5173/login avec l'email et le mot de passe choisis.
