# Audit pré full-broad – Plateforme SAVANA

**Date :** 12 mars 2025  
**Objectif :** Diagnostics automatiques, tests et analyse des workflows avant version full-broad.

---

## 1. Résultats des audits techniques

### 1.1 ESLint

| Statut | Détails |
|--------|---------|
| ✅ **0 erreurs** | Lint passe |
| ⚠️ **33 warnings** | À traiter progressivement |

**Warnings principaux :**
- **react-hooks/exhaustive-deps** (11 fichiers) : dépendances manquantes dans `useEffect` (ex. `updateOrgSuspension`, `fetchCoachs`, `fetchModules`)
- **react/no-unescaped-entities** (8 fichiers) : apostrophes non échappées dans le JSX (`'` → `&apos;`)
- **Unused eslint-disable** (SuperAdminInvitationsPage) : directives inutiles

### 1.2 Tests unitaires (Vitest)

| Statut | Détails |
|--------|---------|
| ✅ **2 tests passent** | `App.test.jsx` |
| ⚠️ **Warnings act()** | Mises à jour d’état non wrappées dans `act()` |

**Couverture :** Très limitée (1 fichier testé). Recommandation : ajouter des tests pour les hooks critiques (`useModules`, `useCoaching`, `useCoachData`), les pages d’invitation et les formulaires.

### 1.3 Tests E2E (Playwright)

| Statut | Détails |
|--------|---------|
| ❌ **Non exécutables** | Erreur de chemin Windows (`DEVOPS\SAVANA` avec `&`) |

**Tests définis :** 4 scénarios dans `certification-flow.spec.js` :
- Page login (formulaire, champs, bouton)
- Page accept-invitation (code, validation)
- Redirection `/incube` → login si non connecté
- Redirection `/` → login si non connecté

### 1.4 Build production

| Statut | Détails |
|--------|---------|
| ✅ **Build OK** | 6.49s |
| ⚠️ **Chunk > 500 kB** | `index-*.js` ~710 kB – envisager le code-splitting |

---

## 2. Incohérences critiques frontend / backend

### 2.1 🔴 Invitation Admin – RPC inexistante

| Frontend | Backend (migrations) | Impact |
|----------|----------------------|--------|
| `accept_admin_invitation` | `consume_admin_invitation` | **L’acceptation d’invitation admin échoue** (RPC introuvable) |
| `invite_admin` (params: `org_id`, `email`, `full_name`) | `create_admin_invitation` (params: `p_organisation_id`, `p_email`, `p_full_name`) | **Création d’invitation admin échoue** (RPC et noms de params différents) |

**Fichiers concernés :**
- `AcceptAdminInvitationPage.jsx` ligne 38
- `SuperAdminOrgDetailPage.jsx` lignes 247, 270, 297
- `SuperAdminDashboard.jsx` ligne 271

**Correction appliquée :** Migration `migration-fix-admin-invitation-rpc.sql` créée. Exécuter dans le SQL Editor Supabase pour activer les alias `accept_admin_invitation` et `invite_admin`.

### 2.2 Documentation MIGRATIONS-ORDER.md

La doc mentionne `accept_admin_invitation` alors que la migration définit `consume_admin_invitation`. À aligner.

---

## 3. Cartographie des workflows

### 3.1 Inscription

| Flux | Statut | Notes |
|------|--------|-------|
| Incubé (code invitation) | ✅ Corrigé | Gestion confirmation email + localStorage |
| Admin (lien invitation) | ❌ Cassé | RPC `accept_admin_invitation` inexistante |

### 3.2 Connexion et rôles

| Rôle | Redirection | Statut |
|------|-------------|--------|
| Incubé | `/incube` | ✅ |
| SUPER_ADMIN | `/super-admin` | ✅ |
| ADMIN_ORG / ADMIN | `/admin-org` | ✅ |
| COACH | `/coach` | ✅ (après migration RLS) |
| CERTIFICATEUR | `/certificateur` | ✅ |

### 3.3 Parcours incubé

| Composant | Dépendances | Risques |
|-----------|-------------|---------|
| Modules | assignations, promotions | Incubé sans assignation → modules vides |
| Coach | assignations | Incubé sans coach → coaching désactivé |
| Quiz | score ≥ 70 % | ✅ Corrigé (pas de progression si échec) |
| Vidéo / texte | progression | ✅ Boutons « Revoir » ajoutés |

### 3.4 Coach

| Action | Statut |
|--------|--------|
| Voir incubés assignés | ✅ (après `migration-fix-coach-rls.sql`) |
| Validation mois | ✅ |
| Messages / RDV | ✅ |
| Clé 1 (autoriser certification) | ✅ |

### 3.5 Admin Org

| Écran | Statut |
|-------|--------|
| Dashboard, Incubés, Codes, Promotions | ✅ |
| Matrixage (assignations) | ✅ |
| Modules, Toolbox | ✅ |
| Nom organisation dans sidebar | ✅ Corrigé |

### 3.6 Super Admin

| Action | Statut |
|--------|--------|
| Création organisation | ✅ (Edge Function ou fallback) |
| Invitation admin | ❌ RPC `invite_admin` inexistante |
| Staff, Invitations | ✅ |

---

## 4. Points critiques et risques

### 4.1 Dépendances entre tables

```
organisations
├── staff_users, promotions, incubes
├── assignations (incube_id, coach_id, promotion_id)
├── learning_modules, invitation_codes, admin_invitations
└── certification_sessions, certification_candidates
```

- **Incubé sans assignation** : pas de modules, pas de coach → message explicite.
- **Suppression promotion** : cascade sur assignations.

### 4.2 Race conditions potentielles

| Situation | Risque | Mitigation |
|-----------|--------|------------|
| Double clic « Lancer l'examen » | Double appel `start_certification_exam` | Désactiver le bouton pendant l’appel |
| Double submit quiz | `markCompleted` en parallèle | Désactiver le bouton pendant le submit |
| `onAuthStateChange` + init | Chargement profil en double | Géré par React (dernier état gagne) |

### 4.3 RLS et sécurité

| Élément | Statut |
|---------|--------|
| Coach (assignations, incubes) | ✅ Corrigé par `migration-fix-coach-rls.sql` |
| auth.role() vs staff_users | Migrations partielles – vérifier certificateur, exam_questions |
| Codes invitation | `max_uses`, `used_count` ✅ |
| Tokens admin | `expires_at`, `used_at` ✅ |

---

## 5. Actions recommandées (priorité)

### Priorité 1 – Bloquants

1. **Corriger l’invitation admin** : aligner frontend et backend (RPC `consume_admin_invitation` / `create_admin_invitation`).
2. **Vérifier/créer `invite_admin`** : soit créer la RPC avec les bons paramètres, soit adapter le frontend pour `create_admin_invitation`.

### Priorité 2 – Qualité

3. Corriger les warnings ESLint (exhaustive-deps, unescaped-entities).
4. Ajouter des tests unitaires pour les hooks et pages critiques.
5. Résoudre le problème Playwright sur Windows (chemin avec `&`) ou exécuter les E2E sur un autre environnement.

### Priorité 3 – Performance

6. Envisager le code-splitting pour réduire la taille du bundle (> 500 kB).
7. Protéger contre les doubles clics sur « Lancer l'examen » et soumission de quiz.

---

## 6. Fichiers de référence

| Fichier | Rôle |
|---------|------|
| `src/App.jsx` | Routing, auth, redirection, profil, suspension org |
| `src/hooks/useIncubePortal.js` | Agrégation données incubé |
| `src/hooks/useModules.js` | Modules, progression, quiz |
| `src/hooks/useCoaching.js` | Coaching, RDV, messages |
| `docs/migration-fix-coach-rls.sql` | Correction RLS coach |
| `docs/migration-admin-invitations.sql` | Invitations admin (consume_admin_invitation) |

---

*Rapport généré automatiquement à partir des audits et de l’analyse du code.*
