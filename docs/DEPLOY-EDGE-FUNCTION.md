# Déploiement de l'Edge Function create-platform-user

L'application utilise l'Edge Function `create-platform-user` pour créer des comptes (Admin Org, Coach, Certificateur, Incubé) directement depuis l'interface. Si cette fonction n'est pas déployée, vous verrez une erreur CORS.

## Contournement automatique

En cas d'échec (fonction non déployée, CORS, etc.), l'app utilise automatiquement le flux **invitation admin** : un lien d'invitation est généré et peut être envoyé à l'administrateur pour qu'il crée son compte.

## Déployer la fonction (optionnel)

Pour activer la création directe de comptes :

1. Installer le [Supabase CLI](https://supabase.com/docs/guides/cli)
2. Se connecter : `supabase login`
3. Lier le projet : `supabase link --project-ref klrywioslvelkdvyzwbe`
4. Déployer : `npm run functions:deploy`

Variables d'environnement requises (définies dans Supabase Dashboard → Edge Functions → Secrets) :
- `SUPABASE_URL` (automatique)
- `SUPABASE_SERVICE_ROLE_KEY` (automatique)
- `RESEND_API_KEY` (optionnel, pour envoyer l'email de bienvenue)
- `PLATFORM_URL` (optionnel, ex. `http://localhost:5173`)
