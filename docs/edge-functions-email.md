# Edge Function : envoi d’email à la création de compte

La fonction **create-platform-user** envoie un email (mot de passe temporaire + lien de connexion) après la création d’un compte, via l’API Resend.

## Secrets Supabase (Edge Functions)

À configurer dans **Supabase** → **Project Settings** → **Edge Functions** → **Secrets** (ou via CLI `supabase secrets set`).

| Secret | Obligatoire | Description |
|--------|-------------|-------------|
| `RESEND_API_KEY` | Oui (pour envoyer l’email) | Clé API Resend ([resend.com](https://resend.com) → API Keys). Sans cette clé, le compte est quand même créé mais aucun email n’est envoyé. |
| `RESEND_FROM` | Non | Adresse d’envoi affichée, ex. `CERIP Incubation <noreply@votredomaine.com>`. Par défaut : `CERIP Incubation <onboarding@resend.dev>` (domaine de test Resend). |
| `PLATFORM_URL` | Non | URL du portail (lien « Se connecter » dans l’email). Par défaut : `https://votre-app.vercel.app`. Mettre l’URL réelle (ex. `https://savana-xxx.vercel.app`). |

## Comportement

- Lorsqu’un admin (Super Admin ou Admin Org) crée un compte (incubé, coach, certificateur, admin org), la fonction :
  1. Crée l’utilisateur Auth et la ligne dans `staff_users` ou `incubes`.
  2. Envoie un email à l’adresse du nouveau compte avec le mot de passe temporaire et le lien de connexion.
- Si l’envoi d’email échoue (clé absente, erreur Resend, etc.), la création du compte **n’est pas annulée** : le mot de passe temporaire reste affiché une fois dans l’interface admin.

## Déploiement de la fonction

```bash
npx supabase functions deploy create-platform-user
```

Puis configurer les secrets ci-dessus dans le projet Supabase.
