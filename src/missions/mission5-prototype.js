/**
 * MISSION 5 — PROTOTYPE
 * Parcours « L'IDÉATEUR » — CERIP (Version SaaS Gamifiée)
 */

export const MISSION_5_CONFIG = {
  metadata: {
    MISSION_ID: 'ideateur_m5_prototype',
    PARCOURS: 'L\'IDÉATEUR',
    ORDRE: 5,
    XP_TOTAL: 300,
    BADGE: 'Créateur de Prototype',
    BADGE_ICON: '🔨',
    PREREQUIS: 'ideateur_m4_modele'
  },

  immersion: {
    title: 'Créer votre premier prototype',
    videoID: '',
    estimatedTime: '15-20 minutes',
    validationRule: 'Scroll complet ou vidéo ≥ 95%',
    xpReward: 50,
    content: {
      sections: [
        {
          title: 'INTRODUCTION : DU CONCEPT AU PROTOTYPE',
          content: `Un prototype permet de tester votre solution avec de vrais clients avant de tout construire.`
        }
      ]
    }
  },

  comprehensionTest: {
    title: 'Test de Compréhension',
    passingScore: 75,
    xpReward: 100,
    questions: [
      {
        id: 'q1',
        type: 'qcm',
        question: 'Pourquoi créer un prototype ?',
        options: [
          'Pour impressionner les investisseurs',
          'Pour tester avec de vrais clients avant de tout construire',
          'Pour gagner du temps'
        ],
        correctAnswer: 1,
        explanation: 'Le prototype permet de tester la solution avec de vrais clients avant d\'investir dans le développement complet.'
      }
    ],
    feedback: {
      success: 'Bravo !',
      failure: 'Relis les concepts.'
    }
  },

  projectForm: {
    title: 'Ancrage Projet : Mon Prototype',
    description: 'Décrivez votre prototype.',
    xpReward: 150,
    fields: [
      {
        fieldName: 'prototype_description',
        label: 'Décrivez votre prototype',
        type: 'textarea',
        required: true,
        placeholder: 'Décrivez votre prototype...',
        minLength: 50
      }
    ]
  },

  capitalization: {
    xpAward: 300,
    badge: {
      name: 'Créateur de Prototype',
      icon: '🔨',
      description: 'A créé son premier prototype'
    },
    nextMission: 'ideateur_m6_identite',
    feedback: {
      success: 'Prototype créé. Tu peux maintenant définir ton identité de marque.',
      synthesis: 'Synthèse automatique générée par l\'IA'
    }
  }
};

export default MISSION_5_CONFIG;
