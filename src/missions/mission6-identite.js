/**
 * MISSION 6 — IDENTITÉ
 * Parcours « L'IDÉATEUR » — CERIP (Version SaaS Gamifiée)
 */

export const MISSION_6_CONFIG = {
  metadata: {
    MISSION_ID: 'ideateur_m6_identite',
    PARCOURS: 'L\'IDÉATEUR',
    ORDRE: 6,
    XP_TOTAL: 300,
    BADGE: 'Maître de Marque',
    BADGE_ICON: '🎨',
    PREREQUIS: 'ideateur_m5_prototype'
  },

  immersion: {
    title: 'Définir votre identité de marque',
    videoID: '',
    estimatedTime: '15-20 minutes',
    validationRule: 'Scroll complet ou vidéo ≥ 95%',
    xpReward: 50,
    content: {
      sections: [
        {
          title: 'INTRODUCTION : VOTRE IDENTITÉ DE MARQUE',
          content: `Votre identité de marque est ce qui vous distingue et crée une connexion émotionnelle avec vos clients.`
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
        question: 'Qu\'est-ce qu\'une identité de marque ?',
        options: [
          'Le logo uniquement',
          'Ce qui vous distingue et crée une connexion avec vos clients',
          'Le nom de l\'entreprise'
        ],
        correctAnswer: 1,
        explanation: 'L\'identité de marque est ce qui vous distingue et crée une connexion émotionnelle avec vos clients.'
      }
    ],
    feedback: {
      success: 'Bravo !',
      failure: 'Relis les concepts.'
    }
  },

  projectForm: {
    title: 'Ancrage Projet : Mon Identité',
    description: 'Définissez votre identité de marque.',
    xpReward: 150,
    fields: [
      {
        fieldName: 'identite_marque',
        label: 'Décrivez votre identité de marque',
        type: 'textarea',
        required: true,
        placeholder: 'Nom, valeurs, personnalité de votre marque...',
        minLength: 50
      }
    ]
  },

  capitalization: {
    xpAward: 300,
    badge: {
      name: 'Maître de Marque',
      icon: '🎨',
      description: 'A défini son identité de marque'
    },
    nextMission: null, // Fin du Parcours 1
    feedback: {
      success: 'Félicitations ! Tu as complété le Parcours 1 : L\'IDÉATEUR. Tu es maintenant prêt pour le Parcours 2 : LA JEUNE POUSSE.',
      synthesis: 'Synthèse finale du parcours générée par l\'IA'
    }
  }
};

export default MISSION_6_CONFIG;
