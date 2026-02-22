# Ordre d’exécution des migrations Supabase (SAVANA)

À exécuter dans le **SQL Editor** Supabase (Dashboard → SQL Editor), **dans l’ordre** ci‑dessous.  
Le MCP Supabase du projet est en `--read-only`, donc les migrations doivent être lancées à la main.

---

## 1. Schéma de base

| # | Fichier | Description |
|---|---------|--------------|
| 1 | `schema.sql` | Tables de base : organisations, staff_users, promotions, incubes, assignations, certification_sessions, certification_candidates + RLS initial (auth.role()) |

---

## 2. Extensions et RLS critiques (création d’organisation persistante)

| # | Fichier | Description |
|---|---------|--------------|
| 2 | `migration-organisations-extended.sql` | Colonnes organisations : legal_form, sector_activity, region, department, commune, address, phone, email_org, ninea |
| 3 | `migration-rls-read-own-profile.sql` | Lecture du profil (staff_users / incubes) pour que l’app charge le rôle → redirection dashboard |
| 4 | **`migration-rls-super-admin-organisations.sql`** | **Permet au Super Admin (via staff_users.role = 'SUPER_ADMIN') de créer/lire/modifier/supprimer organisations et staff.** Sans cette migration, la création d’organisation depuis le dashboard Super Admin ne persiste pas (RLS bloque l’INSERT). |

---

## 3. Invitations et demandes

| # | Fichier | Description |
|---|---------|--------------|
| 6 | `migration-invitations.sql` | Table invitation_codes + fonction validate_invitation_code |
| 7 | `rls-invitation_codes.sql` | RLS invitation_codes (Super Admin + Admin Org) |
| 8 | `migration-admin-invitations.sql` | Table admin_invitations + fonctions create_admin_invitation, validate_admin_invitation_token, accept_admin_invitation |
| 9 | `migration-coaching-requests.sql` | Table coaching_requests + RLS incubé/coach |
| 10 | `migration-super-admin-coaching-requests.sql` | RLS : Super Admin peut tout voir sur coaching_requests |

---

## 4. Pédagogie et modules

| # | Fichier | Description |
|---|---------|--------------|
| 10 | `migration-pedagogie.sql` | learning_modules, module_quiz_questions, module_quiz_choices, incube_module_progress + RLS |
| 11 | `migration-modules-extensible.sql` | Contraintes type/parcours_phase étendues sur learning_modules |
| 12 | `migration-learning-modules-promotion-formateur.sql` | Colonnes learning_modules : promotion_id, formateur_id (évite l’erreur « column promotion_id does not exist ») |
| 13 | `migration-vision-client-learning-modules-mois.sql` | Colonnes mois sur learning_modules (si applicable) |
| 14 | `migration-learning-modules-admin-org-delete.sql` | RLS : Admin Org peut supprimer/modifier les modules de son org (basé sur staff_users) |

---

## 5. Incubés, RDV, boîte à outils

| # | Fichier | Description |
|---|---------|--------------|
| 15 | `migration-vision-client-incube-params.sql` | Colonnes incubes + table incube_mois_validation |
| 16 | `migration-vision-client-rdv-messages.sql` | Colonnes coaching_requests + table coach_incube_messages |
| 17 | `migration-vision-client-toolbox.sql` | Table toolbox_documents + RLS |
| 18 | `migration-storage-toolbox-documents.sql` | Bucket Storage `toolbox-documents` + politiques RLS (upload Admin Org, lecture incubés/staff) |
| 19 | `migration-storage-module-assets.sql` | Bucket `module-assets` + RLS (Admin Org) |

---

## 6. Certification et profil

| # | Fichier | Description |
|---|---------|--------------|
| 20 | `migration-qcm-certification.sql` | exam_questions, exam_question_choices + RLS certification |
| 21 | `migration-p1-p2-progression.sql` | Trigger progression P1 → P2 (score ≥ 70 %) |
| 22 | `migration-rls-admin-org-incubes.sql` | RLS Admin Org sur incubes (lecture/update de son org) |
| 23 | `migration-rls-update-own-profile.sql` | Mise à jour du profil (staff_users_update_own, incubes_update_own) |

---

## Résumé prioritaire (si déjà en prod partielle)

Si la **création d’organisation** ne persiste pas, exécuter au minimum :

1. **`migration-rls-super-admin-organisations.sql`** (nouvelle migration ajoutée pour ce correctif).

Si d’autres erreurs apparaissent (modules 400, suppression module Admin Org, upload boîte à outils), exécuter dans l’ordre :

- `migration-learning-modules-promotion-formateur.sql`
- `migration-learning-modules-admin-org-delete.sql`
- `migration-storage-toolbox-documents.sql`

Voir aussi `PREPRODUCTION-MIGRATIONS.md` pour le sous-ensemble pré-production.
