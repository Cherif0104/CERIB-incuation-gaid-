# Déploiement Savana sur Vercel

## Prérequis

- Compte [Vercel](https://vercel.com)
- Projet Supabase configuré (URL + clé anon)

## Étapes

### 1. Pousser le code

Assure-toi que le dépôt Git (GitHub, GitLab ou Bitbucket) est à jour.

### 2. Créer le projet sur Vercel

1. [vercel.com](https://vercel.com) → **Add New** → **Project**
2. Importe le dépôt du projet Savana
3. **Framework Preset** : Vite (détecté automatiquement)
4. **Build Command** : `npm run build` (défaut)
5. **Output Directory** : `dist` (défaut)
6. **Install Command** : `npm install` (défaut)

### 3. Variables d’environnement

Dans **Settings** → **Environment Variables**, ajoute :

| Nom | Valeur | Environnement |
|-----|--------|----------------|
| `VITE_SUPABASE_URL` | L’URL de ton projet Supabase (ex. `https://xxxxx.supabase.co`) | Production, Preview |
| `VITE_SUPABASE_ANON_KEY` | La clé **anon** (publique) du projet Supabase (Settings → API) | Production, Preview |

Ne pas mettre la clé **service_role** sur Vercel (réservée au script seed en local).

Pour l’envoi d’email à la création de compte (Edge Function **create-platform-user**), configurer les secrets côté Supabase : voir **`docs/edge-functions-email.md`** (RESEND_API_KEY, PLATFORM_URL, etc.).

### 4. Déployer

- **Deploy** : chaque push sur la branche connectée déclenche un déploiement
- Pour un déploiement manuel : **Deployments** → **Redeploy**

### 5. Vérifications après déploiement

- Ouvrir l’URL fournie par Vercel (ex. `https://savana-xxx.vercel.app`)
- Tester la page de login et une connexion (ex. compte incubé ou admin)
- Vérifier que les appels Supabase fonctionnent (pas d’erreur CORS si le projet Supabase autorise l’origine Vercel)

### Configuration du projet (`vercel.json`)

Le fichier `vercel.json` à la racine configure :

- **rewrites** : toutes les routes (sauf fichiers statiques comme `/assets/`, logos, etc.) sont renvoyées vers `index.html` pour que le routage React (login, dashboards, etc.) fonctionne correctement.

## En cas de problème

- **Page blanche** : vérifier la console du navigateur et que `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` sont bien définis pour l’environnement déployé
- **404 sur une route** : vérifier que les rewrites dans `vercel.json` sont bien appliqués (redéployer si besoin)
- **Erreurs Supabase** : vérifier les politiques RLS et que l’URL du site est autorisée dans Supabase (Authentication → URL redirects si besoin)
