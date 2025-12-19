/**
 * LOGIQUE IA — VALIDATION ET CORRECTION MISSION 1
 * Parcours « L'IDÉATEUR » — CERIP
 */

import { MISSION_1_CONFIG } from '../mission1-probleme.js';

/**
 * Valide les réponses du quiz de compréhension
 */
export function validateComprehensionTest(answers) {
  const questions = MISSION_1_CONFIG.comprehensionTest.questions;
  const passingScore = MISSION_1_CONFIG.comprehensionTest.passingScore;
  
  let correctCount = 0;
  const corrections = [];

  questions.forEach((q, index) => {
    // Chercher la réponse avec l'ID de la question (q.id = 'q1', 'q2', etc.)
    const userAnswer = answers[q.id] || answers[`q${index + 1}`];
    let isCorrect = false;

    switch (q.type) {
      case 'qcm':
        isCorrect = parseInt(userAnswer) === q.correctAnswer;
        break;
      
      case 'true_false':
        isCorrect = userAnswer === String(q.correctAnswer);
        break;
      
      case 'open':
        if (userAnswer && typeof userAnswer === 'string') {
          const answerLower = userAnswer.toLowerCase();
          isCorrect = q.correctAnswers.some(keyword => answerLower.includes(keyword.toLowerCase()));
        }
        break;
      
      case 'example':
        if (userAnswer && typeof userAnswer === 'string') {
          const answerLower = userAnswer.toLowerCase();
          isCorrect = q.keywords.some(keyword => answerLower.includes(keyword.toLowerCase()));
        }
        break;
    }

    if (isCorrect) {
      correctCount++;
    } else {
      corrections.push({
        question: q.question,
        explanation: q.explanation
      });
    }
  });

  const totalQuestions = questions.length;
  const score = correctCount;
  const percentage = Math.round((correctCount / totalQuestions) * 100);
  const passed = percentage >= passingScore;

  return {
    score,
    total: totalQuestions,
    percentage,
    passed,
    feedback: passed 
      ? MISSION_1_CONFIG.comprehensionTest.feedback.success
      : MISSION_1_CONFIG.comprehensionTest.feedback.failure,
    corrections
  };
}

/**
 * Valide le formulaire de projet
 */
export function validateProjectForm(formData) {
  const errors = [];
  const warnings = [];

  // Validation de la description du problème
  if (!formData.problem_description || formData.problem_description.length < 50) {
    errors.push('La description du problème doit contenir au moins 50 caractères');
  }

  // Détection de réponses vagues
  const vagueTerms = ['tout le monde', 'tous', 'chacun', 'n\'importe qui', 'tous les gens', 'les gens'];
  if (vagueTerms.some(term => formData.problem_description?.toLowerCase().includes(term))) {
    warnings.push('Évitez les termes trop génériques. Soyez précis sur votre cible.');
  }

  // Validation de la cible
  const genericTerms = ['tout le monde', 'tous', 'chacun', 'n\'importe qui', 'tous les gens'];
  if (genericTerms.some(term => formData.cible_concernee?.toLowerCase().includes(term))) {
    errors.push('La cible doit être précise, pas générique');
  }

  // Validation du score d'urgence
  const urgencyScore = parseInt(formData.analyse_4u_score) || 0;
  if (urgencyScore < 1 || urgencyScore > 10) {
    errors.push('Le score d\'urgence doit être entre 1 et 10');
  } else if (urgencyScore < 6) {
    warnings.push('Le score d\'urgence est faible (< 6). Assurez-vous que c\'est vraiment urgent pour vos clients.');
  }

  // Validation de l'hypothèse
  if (!formData.hypothese_a_valider || formData.hypothese_a_valider.length < 30) {
    errors.push('L\'hypothèse doit contenir au moins 30 caractères');
  }

  // Vérification que ce n'est pas une solution déguisée
  const solutionKeywords = ['application', 'plateforme', 'système', 'logiciel', 'site web', 'app', 'site'];
  if (solutionKeywords.some(keyword => formData.problem_description?.toLowerCase().includes(keyword))) {
    warnings.push('Attention : assurez-vous de décrire le problème, pas la solution.');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Génère une synthèse du problème
 */
export function generateProblemSynthesis(formData) {
  return `${formData.cible_concernee} rencontre un problème critique : ${formData.problem_description.substring(0, 100)}${formData.problem_description.length > 100 ? '...' : ''}

Score d'urgence (4U) : ${formData.analyse_4u_score}/10
L'hypothèse à valider est : ${formData.hypothese_a_valider.substring(0, 100)}${formData.hypothese_a_valider.length > 100 ? '...' : ''}`.trim();
}

/**
 * Génère un feedback personnalisé
 */
export function generatePersonalizedFeedback(formData, validationResult) {
  let feedback = [];

  if (validationResult.warnings.length > 0) {
    feedback.push(...validationResult.warnings);
  }

  const urgencyScore = parseInt(formData.analyse_4u_score) || 0;
  if (urgencyScore >= 8) {
    feedback.push('Excellent ! Votre problème semble vraiment urgent pour votre cible.');
  } else if (urgencyScore >= 6) {
    feedback.push('Bon score d\'urgence. Assurez-vous que vos clients le ressentent aussi fortement.');
  }

  if (formData.cible_concernee && formData.cible_concernee.length > 30) {
    feedback.push('Votre cible est bien définie, c\'est un bon point de départ.');
  }

  return feedback.length > 0 ? feedback : ['Votre problème est bien formulé. Continuez avec les prochaines étapes !'];
}

/**
 * Calcule un score de qualité du problème
 */
export function calculateProblemQualityScore(formData) {
  let score = 0;
  const maxScore = 100;

  // Description (30 points)
  if (formData.problem_description && formData.problem_description.length >= 50) {
    score += Math.min(30, (formData.problem_description.length / 200) * 30);
  }

  // Cible précise (25 points)
  if (formData.cible_concernee && formData.cible_concernee.length > 20) {
    const genericTerms = ['tout le monde', 'tous', 'chacun', 'n\'importe qui'];
    if (!genericTerms.some(term => formData.cible_concernee.toLowerCase().includes(term))) {
      score += 25;
    }
  }

  // Urgence (25 points)
  const urgencyScore = parseInt(formData.analyse_4u_score) || 0;
  score += (urgencyScore / 10) * 25;

  // Hypothèse (20 points)
  if (formData.hypothese_a_valider && formData.hypothese_a_valider.length >= 30) {
    score += Math.min(20, (formData.hypothese_a_valider.length / 150) * 20);
  }

  return Math.round(score);
}
