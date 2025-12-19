/**
 * MISSION 3 — VALEUR UNIQUE
 * Parcours « L'IDÉATEUR » — CERIP (Version SaaS Gamifiée)
 */

export const MISSION_3_CONFIG = {
  metadata: {
    MISSION_ID: 'ideateur_m3_valeur',
    PARCOURS: 'L\'IDÉATEUR',
    ORDRE: 3,
    XP_TOTAL: 300,
    BADGE: 'Défenseur de Valeur',
    BADGE_ICON: '🛡️',
    PREREQUIS: 'ideateur_m2_solution'
  },

  immersion: {
    title: 'Définir votre proposition de valeur unique',
    videoID: '',
    estimatedTime: '15-20 minutes',
    validationRule: 'Scroll complet ou vidéo ≥ 95%',
    xpReward: 50,
    content: {
      sections: [
        {
          title: 'INTRODUCTION : POURQUOI SOI ?',
          content: `Pourquoi un client choisirait-il VOTRE solution plutôt que celle de la concurrence ?

C'est la question centrale de cette mission. Vous devez identifier ce qui vous rend unique et irremplaçable.`
        },
        {
          title: 'PARTIE I : LA PROPOSITION DE VALEUR UNIQUE (PVU)',
          content: `Votre PVU doit répondre à 3 questions :
1. Quel problème résolvez-vous ?
2. Pour qui ?
3. En quoi êtes-vous différent ?`
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
        question: 'Qu\'est-ce qu\'une Proposition de Valeur Unique ?',
        options: [
          'Le prix de votre produit',
          'Ce qui vous différencie de la concurrence',
          'La description de votre produit'
        ],
        correctAnswer: 1,
        explanation: 'La PVU définit ce qui vous rend unique et irremplaçable par rapport à la concurrence.'
      }
    ],
    feedback: {
      success: 'Bravo ! Tu comprends la valeur unique.',
      failure: 'Relis attentivement les concepts.'
    }
  },

  projectForm: {
    title: 'Ancrage Projet : Ma Valeur Unique',
    description: 'Définissez votre proposition de valeur unique.',
    xpReward: 150,
    fields: [
      {
        fieldName: 'valeur_unique',
        label: 'Votre proposition de valeur unique',
        type: 'textarea',
        required: true,
        placeholder: 'Décrivez ce qui vous rend unique...',
        minLength: 50
      }
    ]
  },

  capitalization: {
    xpAward: 300,
    badge: {
      name: 'Défenseur de Valeur',
      icon: '🛡️',
      description: 'A défini sa proposition de valeur unique'
    },
    nextMission: 'ideateur_m4_modele',
    feedback: {
      success: 'Valeur unique définie. Tu peux maintenant construire ton modèle économique.',
      synthesis: 'Synthèse automatique générée par l\'IA'
    }
  }
};

export default MISSION_3_CONFIG;
