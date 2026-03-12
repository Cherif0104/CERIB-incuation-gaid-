# SAVANA — Passage à 100 % production

**Objectif :** Sortir du mode test, supprimer tout ce qui relève du développement, et livrer une solution 100 % fonctionnelle, persistante et opérationnelle.

---

## 1. Éléments à RETIRER (mode test)

### 1.1 Comptes de test sur la page de connexion

| Fichier | Action |
|---------|--------|
| `src/data/testAccounts.js` | **Supprimer** ou garder uniquement pour scripts internes (hors app) |
| `src/pages/LoginPage.jsx` | **Retirer** : section « Comptes de test (développement) », import de `TEST_ACCOUNTS`, `fillTestAccount`, `showTestAccounts` |
| `scripts/seed-dev-accounts.mjs` | **Optionnel** : garder pour environnements de staging uniquement, ou supprimer si prod seule |

**Raison :** En production, aucun utilisateur ne doit voir des comptes pré-remplis. Risque de sécurité et confusion.

### 1.2 Placeholders « exemple »

| Fichier | Champ | Remplacer |
|---------|-------|-----------|
| `AdminOrgCoachsPage.jsx` | placeholder `coach@exemple.sn` | `email@votre-organisation.com` ou vide |
| `AdminOrgCertificateursPage.jsx` | placeholder `certificateur@exemple.sn` | idem |
| `AdminOrgIncubesPage.jsx` | placeholder `incube@exemple.sn` | idem |
| `SuperAdminStaffPage.jsx` | placeholder `certificateur@exemple.sn` | idem |

**Raison :** `exemple.sn` est un domaine fictif. En prod, utiliser des placeholders neutres.

### 1.3 Données seed « exemple »

Les incubés seed (`awa.diop@exemple.sn`, etc.) dans `docs/seed.sql` et `seed-learning-modules-cerip.sql` sont des données de démo. En prod :

- Soit ne pas exécuter les seeds (données vides)
- Soit créer un script `seed-prod.sql` avec des données réelles ou vides
- Les organisations `cerip-dakar` et `incubateur-thies` peuvent rester comme exemples si le client les utilise, sinon les créer via l’UI Super Admin

---

## 2. Éléments NON IMPLÉMENTÉS ou INCOMPLETS

### 2.1 Certificateur : accès bloqué

**Problème :** `App.jsx` L.246 : `if (p.role === 'CERTIFICATEUR') return '/login'`  
→ Un Certificateur connecté est redirigé vers la page de login au lieu de son dashboard.

**Correction :**
```javascript
if (p.role === 'CERTIFICATEUR') return '/certificateur';
```

**À ajouter :**
- Route `/certificateur` avec layout (DashboardLayout ou CertificateurLayout)
- Sous-routes : `/certificateur` (dashboard), `/certificateur/questions` (banque de questions)
- Navigation `navByRole.CERTIFICATEUR` dans le layout

### 2.2 Matrixage et Certificateurs : pages orphelines

**Problème :** `AdminOrgMatrixagePage` et `AdminOrgCertificateursPage` existent mais ne sont ni routées ni dans le menu.

**Correction :**
- Ajouter dans `App.jsx` : `<Route path="matrixage" element={<AdminOrgMatrixagePage />} />` et `<Route path="certificateurs" element={<AdminOrgCertificateursPage />} />`
- Ajouter dans `DashboardLayout.jsx` (navByRole.ADMIN_ORG et ADMIN) : Matrixage, Certificateurs

### 2.3 Workflow examen de certification : chaîne cassée

**Flux métier attendu :**
```
Coach valide (Clé 1) → Certificateur ouvre session (Clé 2) → Incubé lance examen → QCM → Résultat
```

**Manques :**

| Étape | État | Action |
|-------|------|--------|
| Coach valide (Clé 1) | ✅ | — |
| Certificateur crée session, ouvre fenêtre | ✅ | — |
| **Lien candidat ↔ session** | ❌ | Le coach crée un `certification_candidate` avec `session_id = null`. Aucune UI pour lier le candidat à une session. |
| **Incubé lance l'examen** | ❌ | Pas de bouton « Lancer l'examen » dans `IncubePortal`. `IncubeExamPage` existe mais n'est jamais rendue. |
| **Passage PENDING → IN_PROGRESS** | ❌ | Aucune RPC ni logique pour démarrer l'examen (session_id, exam_started_at, exam_status). |

**Correction recommandée (auto-assignation) :**

1. Créer une RPC `start_certification_exam` qui :
   - Vérifie : incubé Clé 1 (global_status = COACH_VALIDATED), candidat PENDING, session OPEN dans la fenêtre
   - Met à jour le candidat : session_id, exam_status = IN_PROGRESS, exam_started_at
   - Met à jour incubes : global_status = EXAM_IN_PROGRESS
   - Retourne le candidate_id

2. Dans `IncubePortal` : ajouter un bouton « Lancer l'examen » visible si :
   - `global_status === 'COACH_VALIDATED'`
   - Une session OPEN existe dans la fenêtre (vérifier via un fetch ou état)

3. Au clic : appeler `supabase.rpc('start_certification_exam')`, puis naviguer vers `/incube/exam`

4. Ajouter la route `/incube/exam` avec `IncubeExamPage` (ou intégrer dans le layout incubé)

### 2.4 Assignation candidat → session (option alternative)

Si le Certificateur doit assigner manuellement les candidats aux sessions :

- Dans `CertificateurDashboard`, pour chaque candidat PENDING : select « Session » + bouton « Assigner »
- Mettre à jour `certification_candidates.session_id`
- L'incubé ne peut lancer l'examen que si son candidat a un `session_id` ET que cette session est OPEN

---

## 3. Incohérences et illogismes

### 3.1 Rôle Certificateur défini mais inutilisable

Le rôle `CERTIFICATEUR` existe en base, dans les labels, dans les seeds, mais la redirection le renvoie vers `/login`. C'est incohérent : soit on retire le rôle, soit on lui donne un accès fonctionnel.

**Recommandation :** Activer l'accès Certificateur (voir 2.1).

### 3.2 Matrixage essentiel mais inaccessible

Le matrixage (Incubé ↔ Promotion ↔ Coach) est indispensable pour que le coach voie ses incubés. Le lien existe dans le dashboard Admin Org (« Matrixage : Incubé + Promo + Coach ») mais la page n'est pas routée. L'utilisateur ne peut pas y accéder.

**Recommandation :** Routage + menu (voir 2.2).

### 3.3 Workflow certification à moitié implémenté

On a :
- Création de candidats (Coach)
- Création de sessions (Certificateur)
- RPC de soumission d'examen
- Page d'examen (IncubeExamPage)

Mais aucun moyen pour l'incubé de **démarrer** l'examen. La chaîne s'arrête au milieu.

### 3.4 Candidat sans session

`certification_candidates.session_id` est nullable. Le Coach crée un candidat sans session. Le Certificateur voit « Voir candidats (0) » car le filtre est `session_id === s.id`. Les candidats PENDING n'apparaissent dans aucune session.

**Options :**
- **A** : Auto-assignation à la première session OPEN (RPC `start_certification_exam`)
- **B** : UI Certificateur pour assigner manuellement

### 3.5 Placeholders et domaines fictifs

Les placeholders `@exemple.sn` et `@cerip-dev.sn` ne doivent pas apparaître en prod. Remplacer par des libellés neutres ou vides.

---

## 4. Approches à améliorer

### 4.1 Gestion des erreurs

- Beaucoup de `setError(err.message)` sans feedback structuré pour l'utilisateur
- Pas de toasts ou notifications globales pour les succès/erreurs
- **Recommandation :** Introduire un système de notifications (toast) pour les actions (création, mise à jour, erreur)

### 4.2 Variables d'environnement

- Seules `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` sont utilisées
- Pas de distinction explicite dev/staging/prod
- **Recommandation :** Documenter les variables requises pour la prod (Vercel, etc.) et éviter tout fallback « placeholder » en prod

### 4.3 Validation des formulaires

- Validation côté client limitée (required, format email)
- Pas de validation côté serveur structurée (les RPC renvoient des erreurs mais pas de schéma commun)
- **Recommandation :** Renforcer la validation (ex. Zod, Yup) sur les formulaires critiques

### 4.4 Gestion du chargement

- Overlays et états de chargement présents mais parfois incohérents
- **Recommandation :** Harmoniser les états de chargement (skeleton, spinner) sur les listes et formulaires

### 4.5 Tests unitaires

- `App.test.jsx` existe avec des mocks
- Pas de tests E2E pour les workflows critiques
- **Recommandation :** Garder les tests unitaires, ajouter des tests E2E pour le parcours certification (optionnel pour MVP prod)

---

## 5. Plan d'action pour 100 % production

### Phase 1 — Nettoyage (priorité haute)

| # | Action | Fichiers |
|---|--------|----------|
| 1 | Retirer la section « Comptes de test » de la page de connexion | `LoginPage.jsx` |
| 2 | Supprimer ou isoler `testAccounts.js` (ne plus l'importer dans l'app) | `testAccounts.js`, `LoginPage.jsx` |
| 3 | Remplacer les placeholders `@exemple.sn` par des libellés neutres | `AdminOrgCoachsPage`, `AdminOrgCertificateursPage`, `AdminOrgIncubesPage`, `SuperAdminStaffPage` |

### Phase 2 — Compléter les workflows (priorité haute)

| # | Action | Fichiers |
|---|--------|----------|
| 4 | Activer l'accès Certificateur : redirection `/certificateur`, routes, layout | `App.jsx`, `DashboardLayout.jsx` |
| 5 | Routage Matrixage et Certificateurs (Admin Org) | `App.jsx`, `DashboardLayout.jsx` |
| 6 | Créer la RPC `start_certification_exam` | Migration SQL |
| 7 | Intégrer le bouton « Lancer l'examen » + route `/incube/exam` | `IncubePortal.jsx`, `App.jsx` |

### Phase 3 — Données et configuration (priorité moyenne)

| # | Action | Fichiers |
|---|--------|----------|
| 8 | Décider du sort des seeds : vides en prod ou script dédié | `docs/seed.sql`, `seed-learning-modules-cerip.sql` |
| 9 | Documenter les variables d'environnement prod | `docs/deploiement-vercel.md`, `.env.example` |
| 10 | Vérifier les RLS pour le Coach (UPDATE incubes, INSERT certification_candidates) | Migrations |

### Phase 4 — Qualité (priorité basse)

| # | Action |
|---|--------|
| 11 | Notifications toast pour succès/erreurs |
| 12 | Validation formulaires renforcée |
| 13 | Tests E2E parcours certification (optionnel) |

---

## 6. Checklist finale avant mise en prod

- [ ] Aucun compte de test visible sur la page de connexion
- [ ] Aucun placeholder `@exemple.sn` ou `@cerip-dev.sn` dans l'UI
- [ ] Certificateur peut accéder à son dashboard
- [ ] Matrixage et Certificateurs accessibles depuis le menu Admin Org
- [ ] Workflow certification complet : Coach → Certificateur → Incubé lance examen → Résultat
- [ ] RPC `start_certification_exam` déployée
- [ ] Variables d'environnement configurées sur Vercel (ou hébergeur)
- [ ] Seeds prod exécutés (ou données créées via l'UI)
- [ ] Build `npm run build` réussi
- [ ] Test manuel complet : inscription incubé, matrixage, parcours, Clé 1, Clé 2, examen

---

*Document généré pour le passage à une solution 100 % production.*
