# Inscription et sécurité des rôles

## Stratégie

- **Connexion** : e-mail + mot de passe → rôle détecté automatiquement (staff ou incubé) → redirection vers le bon dashboard.
- **Inscription** : **sur invitation uniquement**.
  - **Staff** (Admin, Coach, Certificateur) : comptes créés en interne, pas d’auto-inscription.
  - **Incubés** : accès via **code d’invitation** → page « J'ai reçu une invitation » → saisie du code → formulaire de création de compte.

## Mise en place Supabase

1. Exécuter **`docs/schema.sql`** si ce n’est pas déjà fait.
2. Exécuter **`docs/migration-invitations.sql`** (table `invitation_codes` + RPC `validate_invitation_code` et `accept_invitation`).
3. Insérer un code de test (remplacer `ORG-001` par un `id` existant dans `organisations`) :

```sql
insert into invitation_codes (code, organisation_id, expires_at, max_uses)
values ('TEST2026', 'ORG-001', now() + interval '30 days', 10);
```

Ensuite, aller sur `/signup` → « J'ai reçu une invitation (code) » → saisir `TEST2026` → créer le compte.
