## Démarrage du front en local

1. Installer les dépendances dans le dossier du projet :

```bash
cd "D:\DEVLAB & DEVOPS\CERIP INCUBATION"
npm install
```

2. Vérifier le fichier `package.json` :

- Le script `dev` doit être :

```json
"dev": "node ./node_modules/vite/bin/vite.js"
```

3. Lancer le serveur de développement :

```bash
npm run dev
```

Cela démarre Vite sur le port 5173 (par défaut). Ouvre ensuite :

- `http://localhost:5173`

Pour stopper le serveur, fais `CTRL + C` dans le terminal.

---

## Données persistantes (seed) dans Supabase

Pour avoir des données réalistes et persistantes en base (organisations, promotions, incubés, codes d'invitation) :

1. **Supabase SQL Editor** : exécuter dans l’ordre :
   - `schema.sql` (si pas déjà fait)
   - `migration-invitations.sql`
   - `rls-invitation_codes.sql`
   - **`seed.sql`** → organisations CERIP Dakar / Incubateur Thiès, promotions, codes d’invitation (`cerip2025`, `thies25`), incubés (Awa Diop, Moussa Sow, etc.)

2. **Comptes staff (Admin, Coach)** : ils doivent exister dans **Authentication → Users**.  
   - Crée les utilisateurs (Add user) avec les emails souhaités.  
   - Copie l’**UID** de chaque utilisateur.  
   - Ouvre `seed-staff.sql`, remplace `REMPLACER_PAR_UID_...` par ces UID (format UUID), puis exécute le script dans le SQL Editor.

Après ça, la base contient des données réelles et persistantes ; l’app (login, codes d’invitation, dashboards) s’appuie sur cette base.

