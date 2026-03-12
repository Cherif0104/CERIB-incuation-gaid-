# Corriger les erreurs "Invalid API key" et "403 Forbidden"

## 1. Invalid API key (create-super-admin)

La clé `SUPABASE_SERVICE_ROLE_KEY` est rejetée par Supabase. Causes possibles :
- Clé régénérée ou projet réinitialisé
- Mauvaise clé (anon au lieu de service_role)
- Caractères invisibles ou troncature

**À faire :**

1. Ouvre **Supabase** → projet **klrywioslvelkdvyzwbe** → **Settings** → **API**
2. Dans **Project API keys**, trouve **service_role** (clé secrète)
3. Clique sur **Reveal** puis **Copy**
4. Dans `.env.local`, remplace la ligne `SUPABASE_SERVICE_ROLE_KEY=...` par la nouvelle valeur (sans guillemets, sans espace)

---

## 2. 403 Forbidden (setup:new-project / Management API)

Le token `SUPABASE_ACCESS_TOKEN` n’a pas les droits nécessaires sur ce projet.

**Causes possibles :**
- Token fine-grained sans accès au projet
- Projet dans une autre organisation
- Endpoint `database/query` non disponible sur ton plan

**Solution recommandée : Option B (connexion pooler)**

1. Ouvre **Supabase** → projet **klrywioslvelkdvyzwbe** → **Connect** (ou Settings → Database)
2. Choisis **Session mode** ou **Transaction mode**
3. Copie la **Connection string** complète
4. Dans `.env.local` :

```env
SUPABASE_DB_URL=postgresql://postgres.klrywioslvelkdvyzwbe:TON_MOT_DE_PASSE@aws-0-eu-west-1.pooler.supabase.com:5432/postgres
```

(Remplace par la chaîne exacte copiée depuis le dashboard.)

5. Lance :

```bash
npm run db:migrate
npm run create:super-admin contact.cherif.pro@gmail.com
```

---

## Vérifier que tu es sur le bon projet

Le projet **klrywioslvelkdvyzwbe** doit apparaître dans ton dashboard Supabase. Si tu ne le vois pas, vérifie que tu es connecté au bon compte et à la bonne organisation.

**Project ref** : Settings → General → Reference ID
