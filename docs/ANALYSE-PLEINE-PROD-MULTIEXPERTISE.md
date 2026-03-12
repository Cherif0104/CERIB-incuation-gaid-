# Analyse SAVANA — Pleine production & multiexpertise

**Date :** 12 mars 2025  
**Objectif :** Finaliser le projet pour la mise en production, identifier les incohérences et proposer des corrections.

---

## 1. Ce qui est fait (implémenté)

### 1.1 Authentification et rôles

| Élément | État |
|--------|------|
| Login (email + mot de passe) | ✅ |
| Redirection par rôle | ⚠️ Partiel (Certificateur → /login) |
| Lecture profil (staff / incubé) | ✅ |
| Inscription par invitation (incubés) | ✅ |
| Inscription Admin Org | ✅ |
| Vérification suspension organisation | ✅ |

### 1.2 Super Admin

| Élément | État |
|--------|------|
| Dashboard global | ✅ |
| Organisations (liste, détail, suspendre) | ✅ |
| Staff & rôles | ✅ |
| Invitations | ✅ |
| Demandes & alertes | ✅ |
| Contenu | ✅ |

### 1.3 Admin Organisation

| Élément | État |
|--------|------|
| Dashboard | ✅ |
| Incubés | ✅ |
| Codes d'invitation | ✅ |
| Promotions (P1/P2/MIXTE) | ✅ |
| Coachs | ✅ |
| Modules pédagogiques | ✅ |
| Boîte à outils | ✅ |
| **Matrixage** (assignations Incubé ↔ Promotion ↔ Coach) | ⚠️ Page existante mais **non routée** |
| **Certificateurs** (gestion des certificateurs) | ⚠️ Page existante mais **non routée** |

### 1.4 Coach

| Élément | État |
|--------|------|
| Dashboard (incubés assignés, demandes) | ✅ |
| Fiche incubé (paramètres, livrables, validation mois) | ✅ |
| Clé 1 (Autoriser certification) | ✅ |
| Demandes de coaching / RDV | ✅ |
| Messagerie, convoquer RDV | ✅ |

### 1.5 Certificateur

| Élément | État |
|--------|------|
| Dashboard | ✅ (code prêt) |
| Création de sessions (fenêtres d'examen) | ✅ |
| Ouverture / fermeture Clé 2 | ✅ |
| Banque de questions (CertificateurQuestionsPage) | ✅ |
| **Accès au dashboard** | ❌ **Redirigé vers /login** (App.jsx L.245) |

### 1.6 Incubé

| Élément | État |
|--------|------|
| Portail parcours (modules, quiz, théorie) | ✅ |
| Progression P1/P2, scores | ✅ |
| SOS Coach, RDV, messagerie, SOS urgence | ✅ |
| Boîte à outils | ✅ |
| **Bouton « Lancer l'examen »** | ❌ Absent |
| **Page examen (IncubeExamPage)** | ⚠️ Existe mais **jamais utilisée** |

### 1.7 Pédagogie et certification

| Élément | État |
|--------|------|
| Modules (texte, vidéo, document, quiz) | ✅ |
| Quiz formatifs (score ≥ 70 % pour débloquer) | ✅ |
| Trigger P1 → P2 (si p1_score ≥ 70 %) | ✅ |
| Banque de questions QCM (exam_questions) | ✅ |
| RPC `submit_certification_exam` | ✅ |
| **Assignation candidat → session** | ❌ Pas d'UI |
| **Démarrage examen (PENDING → IN_PROGRESS)** | ❌ Pas de logique ni RPC |

---

## 2. Incohérences et problèmes de logique

### 2.1 Workflow certification incomplet

Le flux métier prévu est :

```
Coach valide (Clé 1) → Certificateur ouvre session (Clé 2) → Incubé lance examen → QCM → Résultat
```

**Problèmes :**

1. **Certificateur bloqué** : `getDashboardPath` renvoie `/login` pour CERTIFICATEUR → le certificateur ne peut jamais accéder à son dashboard.

2. **Candidat orphelin de session** : Le coach crée un `certification_candidate` avec `session_id = null`. Aucune UI ne permet de lier ce candidat à une `certification_session`. Le Certificateur voit « Voir candidats (0) » car `session_id` est toujours null.

3. **Incubé ne peut pas lancer l'examen** :
   - `IncubePortal` n'a pas de bouton « Lancer l'examen ».
   - `IncubeExamPage` charge un candidat avec `exam_status = 'IN_PROGRESS'`, mais rien ne met jamais le statut à `IN_PROGRESS`.
   - Il manque une RPC `start_certification_exam` (ou équivalent) pour : trouver une session OPEN dans la fenêtre, mettre à jour le candidat (session_id, exam_status, exam_started_at), et mettre à jour `incubes.global_status`.

4. **Logique de session floue** : Deux interprétations possibles :
   - **A** : Le Certificateur assigne manuellement chaque candidat à une session.
   - **B** : Tout candidat Clé 1 peut lancer l'examen dès qu'une session est OPEN dans la fenêtre (auto-assignation).

   Actuellement, ni A ni B ne sont implémentés.

### 2.2 Pages orphelines

| Page | Problème |
|------|----------|
| `AdminOrgMatrixagePage` | Pas de route `/admin-org/matrixage`, pas de lien dans le menu |
| `AdminOrgCertificateursPage` | Pas de route, pas de lien dans le menu |
| `IncubeExamPage` | Jamais importée ni rendue ; aucun chemin pour y accéder |

### 2.3 Incohérences promotion / parcours

- **Promotions** : `parcours_type` (P1, P2, MIXTE) et `start_mode` existent, mais le lien avec `incubes.current_parcours` n'est pas explicite. Un incubé peut avoir `current_parcours = P2` sans que sa promotion soit MIXTE.
- **Assignation** : Un incubé peut être assigné à plusieurs promotions (plusieurs lignes dans `assignations`). Les modules sont filtrés par `promotion_id` — si plusieurs promotions, la logique de fusion des modules n'est pas documentée.

### 2.4 RLS et rôles applicatifs

- Les politiques RLS utilisent `auth.role() = 'app_coach'`, `app_certificateur`, etc. Supabase utilise par défaut le rôle `authenticated`. Si ces rôles personnalisés ne sont pas configurés dans le JWT, les politiques peuvent bloquer des opérations légitimes.
- Le coach doit pouvoir : `UPDATE incubes` (Clé 1), `INSERT certification_candidates`. À vérifier dans les migrations.

---

## 3. Proposition de corrections pour la prod

### 3.1 Corrections critiques (priorité haute)

#### A. Activer l'accès Certificateur

**Fichier :** `src/App.jsx`

```javascript
// Ligne 245 : remplacer
if (p.role === 'CERTIFICATEUR') return '/login';
// par
if (p.role === 'CERTIFICATEUR') return '/certificateur';
```

**Ajouter les routes Certificateur :**

```jsx
<Route path="/certificateur" element={requireAuth(..., (p) => p.role === 'CERTIFICATEUR')}>
  <Route index element={<CertificateurDashboard />} />
  <Route path="questions" element={<CertificateurQuestionsPage />} />
</Route>
```

Avec un layout dédié ou réutiliser `DashboardLayout` avec une nav adaptée.

#### B. Routage Matrixage et Certificateurs (Admin Org)

**Fichier :** `src/App.jsx`

Dans les routes `/admin-org` :

```jsx
<Route path="matrixage" element={<AdminOrgMatrixagePage />} />
<Route path="certificateurs" element={<AdminOrgCertificateursPage />} />
```

**Fichier :** `src/components/DashboardLayout.jsx`

Dans `navByRole.ADMIN_ORG` et `ADMIN` :

```javascript
{ to: '/admin-org/matrixage', label: 'Matrixage' },
{ to: '/admin-org/certificateurs', label: 'Certificateurs' },
```

#### C. Workflow examen incubé

**Option recommandée (auto-assignation)** : L'incubé peut lancer l'examen dès qu'il est Clé 1 et qu'une session est OPEN dans la fenêtre.

1. **Créer une RPC `start_certification_exam`** (migration SQL) :

```sql
create or replace function public.start_certification_exam()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_incube_id uuid;
  v_org_id text;
  v_candidate record;
  v_session record;
begin
  select id, organisation_id into v_incube_id, v_org_id
  from incubes where auth_user_id = auth.uid();
  if not found then
    return jsonb_build_object('ok', false, 'error', 'Incubé non trouvé');
  end if;

  if (select global_status from incubes where id = v_incube_id) <> 'COACH_VALIDATED' then
    return jsonb_build_object('ok', false, 'error', 'Clé 1 non validée');
  end if;

  select * into v_candidate from certification_candidates
  where incube_id = v_incube_id and coach_validation_at is not null
    and exam_status = 'PENDING' and exam_result is null
  limit 1;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'Aucun candidat en attente');
  end if;

  select * into v_session from certification_sessions
  where organisation_id = v_org_id and status = 'OPEN'
    and start_at <= now() and end_at >= now()
  limit 1;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'Aucune session ouverte dans la fenêtre actuelle');
  end if;

  update certification_candidates
  set session_id = v_session.id, exam_status = 'IN_PROGRESS', exam_started_at = now()
  where id = v_candidate.id;

  update incubes set global_status = 'EXAM_IN_PROGRESS' where id = v_incube_id;

  return jsonb_build_object('ok', true, 'candidate_id', v_candidate.id);
end;
$$;
```

2. **Dans `IncubePortal`** : ajouter un bouton « Lancer l'examen » visible si :
   - `profile.global_status === 'COACH_VALIDATED'`
   - Une session OPEN existe dans la fenêtre (à vérifier via un petit fetch ou état dérivé).

3. **Au clic** : appeler `supabase.rpc('start_certification_exam')`, puis naviguer vers `/incube/exam`.

4. **Route** : ajouter `<Route path="exam" element={<IncubeExamPage ... />} />` dans le contexte incubé (ou une route `/incube/exam` avec `IncubeProfileLayout`).

#### D. Adapter IncubeExamPage

- `IncubeExamPage` charge actuellement un candidat avec `exam_status = 'IN_PROGRESS'`. Après `start_certification_exam`, le candidat aura ce statut.
- S'assurer que la page est accessible via `/incube/exam` (ou équivalent) et qu'elle reçoit `profile`, `onDone`, `onLogout`.

### 3.2 Option alternative : assignation manuelle (Certificateur)

Si vous préférez que le Certificateur assigne les candidats aux sessions :

1. Dans `CertificateurDashboard`, pour chaque candidat PENDING : ajouter un select « Session » et un bouton « Assigner ».
2. Mettre à jour `certification_candidates.session_id` lors de l'assignation.
3. L'incubé ne peut lancer l'examen que si son candidat a un `session_id` ET que cette session est OPEN et dans la fenêtre.

Cette approche est plus contrôlée mais nécessite plus d'actions manuelles.

### 3.3 Corrections secondaires

- **Navigation Certificateur** : Créer un `CertificateurLayout` ou étendre `DashboardLayout` avec `navByRole.CERTIFICATEUR` : Tableau de bord, Banque de questions.
- **RLS** : Vérifier que le coach peut bien `UPDATE incubes` et `INSERT certification_candidates` (migrations existantes).
- **Tests** : Scénario E2E : inscription → matrixage → parcours → Clé 1 → Clé 2 → examen → résultat.

---

## 4. Synthèse multiexpertise

Le projet repose sur une **multiexpertise** : Super Admin, Admin Org, Coach, Certificateur, Incubé. Chaque rôle a un périmètre défini. Les principaux points de rupture sont :

1. **Certificateur** : Rôle défini en base et en UI, mais accès bloqué.
2. **Matrixage** : Essentiel pour lier incubé / promotion / coach ; page prête mais inaccessible.
3. **Certificateurs (Admin Org)** : Gestion des certificateurs de l'organisation ; page prête mais inaccessible.
4. **Boucle certification** : Clé 1 (Coach) et Clé 2 (Certificateur) sont implémentées, mais le dernier maillon (lancement examen par l'incubé) est manquant.

---

## 5. Plan d'action recommandé

| Ordre | Action | Fichiers |
|-------|--------|----------|
| 1 | Activer route Certificateur + redirection | `App.jsx` |
| 2 | Ajouter routes Matrixage et Certificateurs (Admin Org) | `App.jsx`, `DashboardLayout.jsx` |
| 3 | Créer RPC `start_certification_exam` | Nouvelle migration SQL |
| 4 | Intégrer bouton « Lancer l'examen » + route `/incube/exam` | `IncubePortal.jsx`, `App.jsx` |
| 5 | Vérifier RLS coach (UPDATE incubes, INSERT certification_candidates) | Migrations |
| 6 | Tests manuels complets | — |

---

## 6. Fichiers à modifier (résumé)

- `src/App.jsx` : redirection Certificateur, routes Matrixage/Certificateurs, route `/incube/exam`
- `src/components/DashboardLayout.jsx` : liens Matrixage et Certificateurs pour Admin Org
- `src/pages/IncubePortal.jsx` : bouton « Lancer l'examen », logique d'éligibilité, navigation vers examen
- Nouvelle migration : `start_certification_exam`
- Imports : `CertificateurDashboard`, `CertificateurQuestionsPage`, `AdminOrgMatrixagePage`, `AdminOrgCertificateursPage`, `IncubeExamPage`

---

*Document généré pour finalisation du projet SAVANA en pleine production.*
