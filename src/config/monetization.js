/**
 * CONFIGURATION MONÉTISATION ET CERTIFICATIONS
 * CERIP — Plateforme d'Incubation
 */

export const MONETIZATION_CONFIG = {
  // Prix par module
  PRICE_PER_MODULE: 5000, // En FCFA
  CURRENCY: 'FCFA',
  
  // Missions gratuites (freemium)
  FREE_MISSIONS_MONDE1: 2,
  FREE_MISSIONS_MONDE2: 1,
  
  // Certification
  CERTIFICATION: {
    ENABLED: true,
    REQUIREMENTS: {
      // Pour obtenir une certification, l'utilisateur doit :
      completeAllSteps: true, // Compléter toutes les étapes (immersion, quiz, formulaire)
      minimumQuizScore: 75, // Score minimum au quiz
      formValidated: true // Formulaire validé par l'IA
    },
    ISSUER: 'CERIP',
    RECOGNIZED_BY: [
      'Mastercard',
      'GIZ (Coopération Allemande)',
      'UNICEF',
      'ONU',
      'Partenaires CERIP'
    ]
  },
  
  // Base de données de talents
  TALENT_DATABASE: {
    ENABLED: true,
    TRACKED_DATA: [
      'modules_completed',
      'certifications_obtained',
      'xp_earned',
      'level_reached',
      'skills_acquired',
      'assessment_results',
      'segment_identified',
      'project_status'
    ],
    VISIBILITY_TO_INVESTORS: true // Les investisseurs peuvent consulter les profils (anonymisés ou non)
  }
};

/**
 * Vérifie si un utilisateur peut obtenir une certification pour un module donné
 */
export function canObtainCertification(moduleId, userProgress, moduleConfig) {
  if (!MONETIZATION_CONFIG.CERTIFICATION.ENABLED) return false;
  
  const moduleKey = `m${moduleId}`;
  const progress = userProgress[moduleKey];
  
  if (!progress) return false;
  
  const requirements = MONETIZATION_CONFIG.CERTIFICATION.REQUIREMENTS;
  
  // Vérifier que toutes les étapes sont complétées
  if (requirements.completeAllSteps) {
    if (!progress.theoryDone || !progress.quizPassed || !progress.formDone) {
      return false;
    }
  }
  
  // Vérifier le score minimum au quiz
  if (requirements.minimumQuizScore) {
    const passingScore = moduleConfig?.comprehensionTest?.passingScore || requirements.minimumQuizScore;
    if (progress.quizScore < passingScore) {
      return false;
    }
  }
  
  // Vérifier que le formulaire est validé
  if (requirements.formValidated && !progress.formValidated) {
    return false;
  }
  
  return true;
}

/**
 * Génère les informations de certification pour un module
 */
export function generateCertificationData(moduleId, moduleConfig, userData) {
  const certificationData = {
    moduleId: moduleId,
    moduleTitle: moduleConfig?.metadata?.TITLE || `Mission ${moduleId}`,
    userId: userData.id,
    userName: userData.name,
    dateObtained: new Date().toISOString(),
    issuer: MONETIZATION_CONFIG.CERTIFICATION.ISSUER,
    recognizedBy: MONETIZATION_CONFIG.CERTIFICATION.RECOGNIZED_BY,
    certificateId: `CERIP-${moduleId}-${Date.now()}-${userData.id.substring(0, 8)}`,
    skills: moduleConfig?.capitalization?.skills || [],
    xpEarned: moduleConfig?.metadata?.XP_TOTAL || 0
  };
  
  return certificationData;
}

/**
 * Calcule le prix total pour un ensemble de modules
 */
export function calculatePrice(moduleIds) {
  return moduleIds.length * MONETIZATION_CONFIG.PRICE_PER_MODULE;
}

/**
 * Vérifie si un module est gratuit (freemium)
 */
export function isModuleFree(parcours, moduleNumber, userSubscription = {}) {
  if (userSubscription.isPremium || userSubscription.isPaid) {
    return true; // Les utilisateurs premium ont accès à tout
  }
  
  if (parcours === 'ideateur' || parcours === 'monde1') {
    return moduleNumber <= MONETIZATION_CONFIG.FREE_MISSIONS_MONDE1;
  }
  
  if (parcours === 'jeune_pousse' || parcours === 'monde2') {
    return moduleNumber <= MONETIZATION_CONFIG.FREE_MISSIONS_MONDE2;
  }
  
  return false;
}

export default MONETIZATION_CONFIG;
