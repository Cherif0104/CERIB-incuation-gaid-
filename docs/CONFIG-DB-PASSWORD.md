# Configurer le mot de passe base de données

Pour exécuter `npm run db:setup` (migrations + seeds), il faut le mot de passe Postgres de votre projet Supabase.

## Où le trouver

1. Ouvrez : **https://supabase.com/dashboard/project/klrywioslvelkdvyzwbe/settings/database**
2. Section **Database password** : utilisez le mot de passe défini à la création du projet
3. Si vous l'avez oublié : cliquez sur **Reset database password**, copiez le nouveau mot de passe

## Configuration dans .env.local

Ajoutez (ou modifiez) dans `.env.local` :

```
SUPABASE_DB_PASSWORD=votre_mot_de_passe_ici
```

Puis lancez :

```bash
npm run db:setup
```

L'URL de connexion est construite automatiquement à partir de `VITE_SUPABASE_URL` et `SUPABASE_DB_PASSWORD`.
