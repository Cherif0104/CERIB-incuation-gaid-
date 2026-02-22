# Modules et formulaires par rôle

Résumé des principaux modules (pages / fonctionnalités), formulaires et interdépendances.

---

## Admin Org – Modules pédagogiques

**Fichier** : `src/pages/AdminOrgModulesPage.jsx`

**Formulaire de création / édition** : 3 étapes.

| Étape | Nom | Champs |
|-------|-----|--------|
| 1 | Identité & cible | Titre (obligatoire), Description (optionnel), bloc d’aide interdépendances, Promotion (obligatoire), Formateur / Entraîneur (obligatoire) |
| 2 | Parcours | Phase (P1 / P2 / P3 / Autre + saisie libre), Mois (1–12 ou non assigné), Type de module (texte / vidéo / document / quiz), Ordre / Priorité |
| 3 | Contenu | Selon le type : texte (contenu, lien document, upload PDF), document (URL ou upload), vidéo (URL ou upload), quiz (message « Questions après enregistrement ») |

**Navigation** : passage à l’étape 2 uniquement si titre + promotion + formateur sont renseignés. Message affiché si l’utilisateur tente d’accéder au parcours ou au contenu sans avoir complété l’étape 1.

**Liste des modules** : titre, phase, type, mois, promotion, formateur ; boutons Modifier, Supprimer, Questions (pour les quiz), ordre (monter / descendre).

**Interdépendances** : chaque module est lié à une promotion et à un formateur (staff_users, rôle COACH) de l’organisation. Les modules sont affichés dans le portail incubé selon la promotion de l’incubé (assignations).

---

## Incubé – Portail parcours

**Fichier** : `src/pages/IncubePortal.jsx`

**Pas de formulaire de création** : consultation uniquement. L’incubé voit les modules de sa promotion (filtrés via assignations), par phase et mois. Contenu : texte, vidéo (lien ou fichier), document (visualisation intra en iframe), quiz. CTA principal : « Continuer mon parcours » / « Démarrer mon parcours ». Sections : SAVANNA, THÉORIE, HISTORIQUE JDB, Boîte à outils, SOS Coach, Demande RDV, Messagerie, Urgence SOS.

---

## Coach – Tableau de bord et fiche incubé

**Tableau de bord** : `src/pages/CoachDashboard.jsx`  
KPIs : nombre d’incubés assignés (assignations distinctes par incube_id), nombre de demandes en attente (coaching_requests, statut PENDING). Cartes type MetricCard.

**Fiche incubé** : `src/pages/CoachIncubeDetailPage.jsx`  
Onglets : Paramètres & Profil, Livrables, Historique JDB, Contacter. Formulaires / actions : Paramètres étudiant (modal), Inspection & validation (commentaire, Rejeter / Valider le mois), Envoyer message, Convoquer un RDV. Données chargées depuis assignations, coaching_requests, validations mois, messages.

---

## Super Admin

**Tableau de bord** : `src/pages/SuperAdminDashboard.jsx`  
Liste des organisations, indicateurs globaux (incubés, coachs, promotions, modules, sessions certification), création d’organisation (formulaire long), gestion des quotas et suspension. Pas de module « Modules pédagogiques » (réservé à l’Admin Org).
