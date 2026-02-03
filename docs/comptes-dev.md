# Comptes de test (phase développement)

Un compte par rôle, même mot de passe pour tous, pour tester rapidement sans créer les utilisateurs à la main.  
**Implantés directement dans le projet** : la page de connexion propose une section « Comptes de test » pour remplir le formulaire en un clic.

## Mot de passe commun

**`CeripDev2025!`**

## Comptes par rôle (source : `src/data/testAccounts.js`)

| Rôle            | E-mail                     | Usage                    |
|-----------------|----------------------------|--------------------------|
| Super Admin     | `superadmin@cerip-dev.sn`  | Vue globale, organisations |
| Admin Org       | `admin@cerip-dev.sn`       | CERIP Dakar : codes, promos, coachs, matrixage |
| Coach           | `coach@cerip-dev.sn`       | CERIP Dakar : mes incubés, autoriser certification, demandes coaching |
| Certificateur   | `certificateur@cerip-dev.sn` | Sessions de certification |
| Incubé          | `incube@cerip-dev.sn`      | Parcours P1/P2, levée de main, examen (quand Clé 1+2) |

## Création des comptes (une fois)

1. **Clé service Supabase**  
   Dans Supabase → **Settings** → **API** : copie la clé **service_role** (secret).

2. **Fichier `.env.local`** (à la racine du projet)  
   Ajoute une ligne (sans la committer) :
   ```env
   SUPABASE_SERVICE_ROLE_KEY=ta_cle_service_role_ici
   ```
   Les variables `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` sont déjà utilisées par l’app ; le script lit aussi `VITE_SUPABASE_URL` pour l’URL.

3. **Lancer le script**
   ```bash
   npm run seed:dev
   ```
   Le script crée les utilisateurs dans Auth et les lignes dans `staff_users` / `incubes`. Si un e-mail existe déjà, il est ignoré (pas de doublon).

Après ça, le client peut se connecter avec n’importe quel compte ci-dessus et le mot de passe `CeripDev2025!` pour reprendre les tests.

## Implantation dans l'app

Les accès de test sont implantés directement dans le projet :
- **`src/data/testAccounts.js`** : liste des e-mails et rôles (source unique pour l'interface).
- **Page de connexion** : section repliable « Comptes de test (développement) » ; un clic sur un compte remplit e-mail et mot de passe pour tester chaque rôle.
