# 📋 Liste des Fonctionnalités à Ajouter

## 🎯 PRIORITÉ 1 : FONCTIONNALITÉS DE BASE

### 1. Diagnostic Initial
- [ ] **Configuration du diagnostic** (`src/missions/diagnostic-initial.js`)
  - 5 questions d'évaluation du niveau
  - Calcul des scores Monde 1 vs Monde 2
  - Recommandation de parcours
  
- [ ] **Interface du diagnostic**
  - Affichage des questions une par une
  - Barre de progression
  - Affichage du résultat avec recommandation
  - Option pour choisir un autre parcours

- [ ] **Intégration**
  - Affichage automatique au premier lancement (optionnel, non bloquant)
  - Bouton dans la sidebar pour y accéder à tout moment
  - Sauvegarde du résultat dans localStorage

### 2. Système Freemium
- [ ] **Configuration** (`src/missions/freemium-checker.js`)
  - Définition des missions gratuites (2 pour Monde 1, 1 pour Monde 2)
  - Vérification d'accès aux missions
  - Écran de blocage avec CTA premium

- [ ] **Intégration**
  - Vérification avant chaque accès à une mission
  - Message de blocage élégant
  - Bouton de mise à niveau premium

### 3. Mission 1 : Le Vrai Problème

#### 3.1 Configuration de la Mission
- [ ] **Fichier de configuration** (`src/missions/mission1-probleme.js`)
  - Métadonnées (XP, badge, prérequis)
  - Contenu d'immersion (toutes les sections du cours)
  - Questions du test de compréhension
  - Champs du formulaire de projet
  - Règles de capitalisation

#### 3.2 Étape 1 : Immersion
- [ ] **Affichage du contenu théorique**
  - Intégration de la vidéo YouTube (ID: y2p9Drw7Dfo)
  - Affichage de toutes les sections du cours magistral
  - Validation du scroll ou de la vidéo
  - Attribution de 50 XP après validation

#### 3.3 Étape 2 : Test de Compréhension
- [ ] **Quiz interactif**
  - 4 questions (QCM, vrai/faux, question ouverte, exemple)
  - Validation des réponses
  - Score minimum requis : 75%
  - Feedback et corrections
  - Attribution de XP selon le score

#### 3.4 Étape 3 : Ancrage Projet
- [ ] **Formulaire de projet**
  - Champ 1: Description du problème (textarea, min 50 caractères)
  - Champ 2: Cible concernée (text, cible précise)
  - Champ 3: Analyse 4U score (range 1-10)
  - Champ 4: Hypothèse à valider (textarea)
  - Validation côté client

#### 3.5 Étape 4 : Capitalisation
- [ ] **Validation et synthèse**
  - Validation IA du formulaire (fichier séparé)
  - Génération de feedback personnalisé
  - Calcul du score de qualité
  - Affichage de la synthèse
  - Attribution du badge "Détective de Problème" 🕵️‍♂️
  - Attribution de 300 XP total
  - Déblocage de la Mission 2

#### 3.6 Validation IA
- [ ] **Fichier de validation** (`src/missions/ai-logic/mission1-ai-validator.js`)
  - Validation du quiz de compréhension
  - Validation du formulaire projet
  - Génération de synthèse
  - Feedback personnalisé
  - Calcul du score de qualité

### 4. Structure des Fichiers

- [ ] **Créer la structure de dossiers**
  ```
  src/
  ├── missions/
  │   ├── diagnostic-initial.js
  │   ├── freemium-checker.js
  │   ├── mission1-probleme.js
  │   ├── ai-logic/
  │   │   └── mission1-ai-validator.js
  │   └── schemas/
  │       └── mission1-schema.sql
  └── config/
      └── supabase.js (si utilisation Supabase)
  ```

## 🎯 PRIORITÉ 2 : FONCTIONNALITÉS AVANCÉES

### 5. Persistance des Données
- [ ] **localStorage (développement)**
  - Sauvegarde de la progression
  - Sauvegarde des réponses aux formulaires
  - Sauvegarde du diagnostic
  - Chargement au démarrage

- [ ] **Supabase (production)**
  - Schéma SQL pour les tables
  - Intégration Supabase client
  - Sauvegarde dans la base de données
  - RLS (Row Level Security) policies

### 6. Gamification Complète
- [ ] **Système de badges**
  - Affichage des badges obtenus
  - Animation lors de l'obtention
  - Icônes et descriptions

- [ ] **Progression visuelle**
  - Barre de progression par mission
  - Indicateurs de complétion
  - Statuts (locked, in_progress, completed)

### 7. Missions 2 à 6 (Structure de base)
- [ ] **Missions 2-6** (placeholders)
  - Configuration basique
  - Déblocage progressif
  - Interface de base
  - (Contenu complet à ajouter plus tard)

## 🎯 PRIORITÉ 3 : AMÉLIORATIONS UX/UI

### 8. Navigation Améliorée
- [ ] **Breadcrumbs dynamiques**
  - Affichage du chemin de navigation
  - Liens cliquables

- [ ] **Navigation entre étapes**
  - Boutons précédent/suivant
  - Validation avant passage à l'étape suivante
  - Sauvegarde automatique

### 9. Animations et Transitions
- [ ] **Animations d'apparition**
  - Fade-in pour les contenus
  - Transitions fluides entre pages
  - Animations de badges

### 10. Responsive Design
- [ ] **Mobile-friendly**
  - Adaptation de la sidebar (menu hamburger)
  - Grilles responsives
  - Tailles de police adaptatives

## 🎯 PRIORITÉ 4 : FONCTIONNALITÉS FUTURES

### 11. Parcours 2 : La Jeune Pousse
- [ ] Structure de base
- [ ] Missions du Parcours 2
- [ ] Intégration avec le diagnostic

### 12. Système d'Utilisateurs
- [ ] Authentification (si nécessaire)
- [ ] Profils utilisateurs
- [ ] Historique de progression

### 13. Analytics et Suivi
- [ ] Suivi de progression
- [ ] Statistiques par mission
- [ ] Temps passé par étape

---

## 📝 Notes d'Implémentation

### Ordre recommandé d'implémentation :

1. **Étape 1** : Créer la structure de fichiers et la Mission 1 complète
2. **Étape 2** : Ajouter le diagnostic initial
3. **Étape 3** : Implémenter le système freemium
4. **Étape 4** : Ajouter la persistance des données
5. **Étape 5** : Améliorer l'UX/UI

### Fichiers à créer en priorité :

1. `src/missions/mission1-probleme.js` - Configuration complète Mission 1
2. `src/missions/ai-logic/mission1-ai-validator.js` - Validation IA
3. `src/missions/diagnostic-initial.js` - Configuration diagnostic
4. `src/missions/freemium-checker.js` - Gestion freemium
5. Modifier `index.html` pour intégrer tous ces modules
