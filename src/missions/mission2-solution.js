/**
 * MISSION 2 — SOLUTION
 * Parcours « L'IDÉATEUR » — CERIP (Version SaaS Gamifiée)
 */

export const MISSION_2_CONFIG = {
  // ============================================
  // 🎯 MÉTADONNÉES
  // ============================================
  metadata: {
    MISSION_ID: 'ideateur_m2_solution',
    PARCOURS: 'L\'IDÉATEUR',
    ORDRE: 2,
    XP_TOTAL: 300,
    BADGE: 'Architecte de Solution',
    BADGE_ICON: '🏗️',
    PREREQUIS: 'ideateur_m1_problem' // Nécessite d'avoir complété la Mission 1
  },

  // ============================================
  // 🎓 ÉTAPE 1 — IMMERSION
  // ============================================
  immersion: {
    title: 'Concevoir la solution adaptée au problème validé',
    videoID: '', // À définir selon le document
    estimatedTime: '15-20 minutes',
    validationRule: 'Scroll complet ou vidéo ≥ 95%',
    xpReward: 50,
    content: {
      sections: [
        {
          title: 'INTRODUCTION : DE LA DOULEUR À LA SOLUTION',
          content: `Maintenant que vous avez identifié et validé un problème réel, il est temps de construire la solution parfaite pour le résoudre.

**Attention :** Ne tombez pas dans le piège inverse. Ne créez pas une solution géniale pour un problème qui n'existe pas. Votre solution doit être directement liée au problème que vous avez validé lors de la Mission 1.

Dans cette mission, vous allez apprendre à :
- Concevoir une solution qui répond précisément au problème identifié
- Éviter la sur-ingénierie
- Créer un MVP (Minimum Viable Product) qui résout le problème de manière simple et efficace`
        },
        {
          title: 'PARTIE I : LA SOLUTION MINIMALE VIABLE (MVP)',
          content: `Un MVP n'est pas un produit "bas de gamme". C'est la version la plus simple qui résout efficacement le problème identifié.

**Principe :** Commencez petit, testez, itérez.

Votre MVP doit :
- Résoudre le problème identifié (Mission 1)
- Être utilisable rapidement
- Permettre de valider l'hypothèse avec de vrais clients
- Coûter le moins possible en temps et en ressources`
        },
        {
          title: 'PARTIE II : LES CRITÈRES D\'UNE BONNE SOLUTION',
          content: `Une bonne solution doit être :
- **Simple** : Facile à comprendre et à utiliser
- **Accessible** : À la portée de votre cible (prix, technologie, compétences)
- **Efficace** : Résout vraiment le problème
- **Différenciante** : Meilleure que les solutions existantes sur au moins un critère`
        },
        {
          title: 'PARTIE III : VALIDATION DE LA SOLUTION',
          content: `Avant de construire, validez que votre solution répond bien au problème.

**Méthode :**
1. Présentez votre solution conceptuelle à vos clients cibles
2. Demandez-leur s'ils utiliseraient cette solution
3. Observez leur réaction (enthousiasme = bon signe)
4. Demandez-leur ce qu'ils paieraient pour cette solution`
        },
        {
          title: 'CONCLUSION ET PROCHAINES ÉTAPES',
          content: `Vous avez maintenant une solution claire et validée. La prochaine étape sera de définir votre proposition de valeur unique (Mission 3).`
        }
      ]
    }
  },

  // ============================================
  // 🧠 ÉTAPE 2 — TEST DE COMPRÉHENSION
  // ============================================
  comprehensionTest: {
    title: 'Test de Compréhension',
    passingScore: 75,
    xpReward: 100,
    questions: [
      {
        id: 'q1',
        type: 'qcm',
        question: 'Qu\'est-ce qu\'un MVP ?',
        options: [
          'Un produit bas de gamme',
          'La version la plus simple qui résout efficacement le problème',
          'Un prototype non fonctionnel'
        ],
        correctAnswer: 1,
        explanation: 'Un MVP est la version minimale qui résout efficacement le problème identifié, permettant de valider l\'hypothèse avec de vrais clients.'
      },
      {
        id: 'q2',
        type: 'true_false',
        question: 'Une bonne solution doit être complexe pour impressionner les clients.',
        correctAnswer: false,
        explanation: 'Une bonne solution doit être simple, accessible, efficace et différenciante. La complexité n\'est pas un avantage.'
      },
      {
        id: 'q3',
        type: 'open',
        question: 'Citez les 4 critères d\'une bonne solution.',
        correctAnswers: ['simple', 'accessible', 'efficace', 'différenciante'],
        explanation: 'Une bonne solution doit être simple, accessible, efficace et différenciante.'
      }
    ],
    feedback: {
      success: 'Bravo ! Tu maîtrises les concepts de solution. Tu peux maintenant passer à l\'application.',
      failure: 'Relis attentivement les concepts. Tu dois obtenir au moins 75% pour continuer.'
    }
  },

  // ============================================
  // 🧩 ÉTAPE 3 — ANCRAGE PROJET
  // ============================================
  projectForm: {
    title: 'Ancrage Projet : Ma Solution',
    description: 'Décrivez votre solution en lien avec le problème identifié lors de la Mission 1.',
    xpReward: 150,
    fields: [
      {
        fieldName: 'solution_description',
        label: 'Décrivez votre solution',
        type: 'textarea',
        required: true,
        placeholder: 'Décrivez votre solution de manière claire et concise...',
        minLength: 50,
        validation: {
          rules: [
            'Doit contenir au moins 50 caractères',
            'Doit être en lien avec le problème identifié en Mission 1'
          ]
        }
      },
      {
        fieldName: 'solution_type',
        label: 'Type de solution',
        type: 'text',
        required: true,
        placeholder: 'Ex: Application mobile, Service, Produit physique, etc.',
        validation: {
          rules: [
            'Doit être précis'
          ]
        }
      },
      {
        fieldName: 'avantage_principal',
        label: 'Quel est l\'avantage principal de votre solution ?',
        type: 'textarea',
        required: true,
        placeholder: 'Ex: Plus rapide, moins cher, plus simple, plus fiable...',
        minLength: 30,
        validation: {
          rules: [
            'Doit contenir au moins 30 caractères'
          ]
        }
      }
    ]
  },

  // ============================================
  // 🏁 ÉTAPE 4 — CAPITALISATION
  // ============================================
  capitalization: {
    xpAward: 300,
    badge: {
      name: 'Architecte de Solution',
      icon: '🏗️',
      description: 'A conçu une solution adaptée au problème validé'
    },
    nextMission: 'ideateur_m3_valeur',
    feedback: {
      success: 'Solution validée. Tu as conçu une réponse adaptée au problème. Tu peux maintenant définir ta valeur unique.',
      synthesis: 'Synthèse automatique de la solution en 3-5 lignes générée par l\'IA'
    }
  }
};

export default MISSION_2_CONFIG;
