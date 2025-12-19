/**
 * LOGIQUE IA — VALIDATION ET CORRECTION MISSION 2
 * Parcours « L'IDÉATEUR » — CERIP
 */

import { MISSION_2_CONFIG } from '../mission2-solution.js';

export function validateComprehensionTest(answers) {
  const questions = MISSION_2_CONFIG.comprehensionTest.questions;
  const passingScore = MISSION_2_CONFIG.comprehensionTest.passingScore;
  
  let correctCount = 0;
  const corrections = [];

  questions.forEach((q) => {
    const userAnswer = answers[q.id];
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
      ? MISSION_2_CONFIG.comprehensionTest.feedback.success
      : MISSION_2_CONFIG.comprehensionTest.feedback.failure,
    corrections
  };
}

export function validateProjectForm(formData) {
  const errors = [];
  const warnings = [];

  if (!formData.solution_description || formData.solution_description.length < 50) {
    errors.push('La description de la solution doit contenir au moins 50 caractères');
  }

  if (!formData.solution_type || formData.solution_type.length < 3) {
    errors.push('Le type de solution doit être précis');
  }

  if (!formData.avantage_principal || formData.avantage_principal.length < 30) {
    errors.push('L\'avantage principal doit contenir au moins 30 caractères');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

export function generateSolutionSynthesis(formData) {
  return `Solution : ${formData.solution_type}
  
${formData.solution_description.substring(0, 100)}${formData.solution_description.length > 100 ? '...' : ''}

Avantage principal : ${formData.avantage_principal.substring(0, 100)}${formData.avantage_principal.length > 100 ? '...' : ''}`.trim();
}

export default {
  validateComprehensionTest,
  validateProjectForm,
  generateSolutionSynthesis
};
