/**
 * MISSION 4 — MODÈLE ÉCONOMIQUE
 * Parcours « L'IDÉATEUR » — CERIP (Version SaaS Gamifiée)
 */

export const MISSION_4_CONFIG = {
  metadata: {
    MISSION_ID: 'ideateur_m4_modele',
    PARCOURS: 'L\'IDÉATEUR',
    ORDRE: 4,
    XP_TOTAL: 300,
    BADGE: 'Économiste Entrepreneur',
    BADGE_ICON: '💰',
    PREREQUIS: 'ideateur_m3_valeur'
  },

  immersion: {
    title: 'Construire votre modèle économique viable',
    videoID: '',
    estimatedTime: '15-20 minutes',
    validationRule: 'Scroll complet ou vidéo ≥ 95%',
    xpReward: 50,
    content: {
      sections: [
        {
          title: 'INTRODUCTION : COMMENT GAGNER DE L\'ARGENT ?',
          content: `Un modèle économique définit comment votre entreprise génère des revenus et reste viable financièrement.`
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
        question: 'Qu\'est-ce qu\'un modèle économique ?',
        options: [
          'Le prix de vente',
          'Comment l\'entreprise génère des revenus',
          'Le budget marketing'
        ],
        correctAnswer: 1,
        explanation: 'Le modèle économique définit comment l\'entreprise génère des revenus et reste viable.'
      }
    ],
    feedback: {
      success: 'Bravo !',
      failure: 'Relis les concepts.'
    }
  },

  projectForm: {
    title: 'Ancrage Projet : Mon Modèle Économique',
    description: 'Définissez votre modèle économique.',
    xpReward: 150,
    fields: [
      {
        fieldName: 'modele_economique',
        label: 'Décrivez votre modèle économique',
        type: 'textarea',
        required: true,
        placeholder: 'Comment générez-vous des revenus ?...',
        minLength: 50
      }
    ]
  },

  capitalization: {
    xpAward: 300,
    badge: {
      name: 'Économiste Entrepreneur',
      icon: '💰',
      description: 'A défini son modèle économique'
    },
    nextMission: 'ideateur_m5_prototype',
    feedback: {
      success: 'Modèle économique défini. Tu peux maintenant créer ton premier prototype.',
      synthesis: 'Synthèse automatique générée par l\'IA'
    }
  }
};

export default MISSION_4_CONFIG;
