# Savana — Récapitulatif avant déploiement et test client

## Ce qui a été implanté

### Authentification et accès

- **Connexion** : page login (email + mot de passe, affichage du mot de passe, overlay de chargement).
- **Redirection par rôle** : après connexion, redirection automatique vers le dashboard correspondant.
- **Lecture du profil** : politiques RLS pour que chaque utilisateur puisse lire sa propre fiche (staff ou incubé).
- **Inscription par invitation** : page « Accepter l’invitation » (code + formulaire) avec RPC `validate_invitation_code` et `accept_invitation`.

### Rôles et dashboards

| Rôle | URL après login | Fonctionnalités |
|------|------------------|-----------------|
| **Super Admin** | `/super-admin` | Vue globale : nombre d’organisations, d’incubés, suspendues ; liste des organisations ; Suspendre / Réactiver. |
| **Admin Organisation** | `/admin-org` | Tableau de bord, **Codes d’invitation** (liste + génération), **Promotions** (liste + création), **Coachs** (liste + liaison), **Matrixage** (Incubé / Promo / Coach), **Modules pédagogiques** (liste + création + questions pour les quiz). |
| **Coach** | `/coach` | Liste des incubés assignés, **Autoriser certification** (Clé 1), **Demandes de coaching** (levée de main) avec « Marquer comme traité ». |
| **Certificateur** | `/certificateur` | **Sessions de certification** (création, ouverture/fermeture Clé 2), liste des candidats, **Banque de questions** (gestion des questions du QCM). |
| **Incubé** | `/incube` | Progression (P1/P2, scores), **Modules de formation** (texte/vidéo : marquer comme lu/vu ; quiz : passer le quiz), **Demander une session de coaching**, **Lancer l’examen** (si Clé 1 + Clé 2 + fenêtre ouverte). |

### Parcours et certification

- **Modules pédagogiques** : types texte, vidéo, quiz ; pour les quiz, calcul des scores et recalcul automatique des scores P1/P2 ; **passage automatique P1 → P2** quand le score P1 ≥ 70 % (trigger en base).
- **Examen de certification** : page QCM chronométrée (30 min), soumission via RPC `submit_certification_exam`, résultat CERTIFIED / FAILED (seuil 70 %).

### Migrations Supabase (déjà appliquées via MCP)

- RLS lecture propre profil (`staff_users`, `incubes`).
- Table `invitation_codes` + RPC `validate_invitation_code`, `accept_invitation` + RLS.
- Table `coaching_requests` + RLS.
- Trigger P1 → P2 (`check_p1_to_p2_progression`).
- Tables pédagogie : `learning_modules`, `module_quiz_questions`, `module_quiz_choices`, `incube_module_progress` + RLS + trigger de recalcul des scores.
- Tables QCM : `exam_questions`, `exam_question_choices`, colonnes sur `certification_candidates` + RLS + RPC `submit_certification_exam`.

### Interface

- Charte graphique CERIP (couleurs, typo) appliquée sur toutes les vues.
- Overlay de chargement réutilisable (lion, Savana, messages personnalisables).
- Page 404 pour les routes inconnues.

---

## Ce qui a été exécuté (seeds via MCP)

- **Seed de données** : organisations, promotions, codes d’invitation, incubés (voir `docs/seed.sql`) — organisations (`cerip-dakar`, `incubateur-thies`), promotions, codes d'invitation (`cerip2025`, `thies25`), incubés (4 lignes sans compte Auth — inscription via code).
- **Modules de démo** : 3 modules pour `cerip-dakar` (P1 : texte + quiz ; P2 : texte) avec 2 questions pour le quiz P1.
- **Questions d'examen** : 2 questions de démo pour `cerip-dakar` (Banque de questions) avec réponses, pour tester le QCM.

## Ce qui reste à faire une fois (comptes de test)

- **Comptes de test** : exécuter **`npm run seed:dev`** en local (voir `docs/comptes-dev.md`) après avoir ajouté `SUPABASE_SERVICE_ROLE_KEY` dans `.env.local`. Cela crée les utilisateurs Auth (superadmin@cerip-dev.sn, admin@cerip-dev.sn, coach@cerip-dev.sn, certificateur@cerip-dev.sn, incube@cerip-dev.sn) et les lie à `staff_users` / `incubes`. Mot de passe commun : `CeripDev2025!`
- **Accès implantés dans l’app** : les accès de test sont définis dans `src/data/testAccounts.js` et affichés sur la **page de connexion** (section repliable « Comptes de test ») : un clic remplit email et mot de passe pour tester chaque rôle.
- **Lier les comptes à une org** : les comptes créés par le script pointent vers une organisation. Pour utiliser les données seed (`cerip-dakar`), adapter le script ou lier manuellement les staff à `cerip-dakar` / `incubateur-thies` si besoin.

---

## Checklist avant déploiement Vercel

1. **Variables d’environnement** : `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` configurées sur Vercel (voir `docs/deploiement-vercel.md`).
2. **Supabase** : dans Authentication → URL redirects, ajouter l’URL de production Vercel si nécessaire.
3. **Build** : `npm run build` réussit en local.
4. **Tests manuels** : login par rôle, au moins un parcours incubé (module + quiz ou examen) et une action Certificateur/Admin/Coach.

---

## Scénario de test client suggéré

1. **Connexion** : utiliser un compte (ex. Admin Org ou Incubé) et vérifier la redirection vers le bon dashboard.
2. **Admin Org** : créer un code d’invitation, une promotion, lier un coach, faire un matrixage, créer un module (texte ou quiz).
3. **Incubé** : voir les modules, marquer un module texte comme lu, passer un quiz si disponible.
4. **Coach** : voir la liste des incubés, une demande de coaching (si une a été envoyée), « Autoriser certification » pour un incubé.
5. **Certificateur** : créer une session (dates début/fin), ouvrir la session, ajouter des questions à la banque.
6. **Incubé** : si éligible (Clé 1 + Clé 2), lancer l’examen, répondre, soumettre, vérifier le résultat.

---

## Fichiers utiles

- **Déploiement** : `docs/deploiement-vercel.md`
- **Comptes de test** : `docs/comptes-dev.md`
- **Inscription par invitation** : `docs/inscription-invitation.md`
