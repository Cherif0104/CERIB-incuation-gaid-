/**
 * LOGIQUE IA — VALIDATION ET CORRECTION MISSION 3
 */

import { MISSION_3_CONFIG } from '../mission3-valeur.js';

export function validateComprehensionTest(answers) {
  const questions = MISSION_3_CONFIG.comprehensionTest.questions;
  const passingScore = MISSION_3_CONFIG.comprehensionTest.passingScore;
  
  let correctCount = 0;
  const corrections = [];

  questions.forEach((q) => {
    const userAnswer = answers[q.id];
    let isCorrect = false;

    if (q.type === 'qcm') {
      isCorrect = parseInt(userAnswer) === q.correctAnswer;
    }

    if (isCorrect) {
      correctCount++;
    } else {
      corrections.push({ question: q.question, explanation: q.explanation });
    }
  });

  const percentage = Math.round((correctCount / questions.length) * 100);
  const passed = percentage >= passingScore;

  return {
    score: correctCount,
    total: questions.length,
    percentage,
    passed,
    feedback: passed ? MISSION_3_CONFIG.comprehensionTest.feedback.success : MISSION_3_CONFIG.comprehensionTest.feedback.failure,
    corrections
  };
}

export function validateProjectForm(formData) {
  const errors = [];
  if (!formData.valeur_unique || formData.valeur_unique.length < 50) {
    errors.push('La proposition de valeur unique doit contenir au moins 50 caractères');
  }
  return { valid: errors.length === 0, errors, warnings: [] };
}

export function generateValeurSynthesis(formData) {
  return `Proposition de Valeur Unique : ${formData.valeur_unique.substring(0, 150)}${formData.valeur_unique.length > 150 ? '...' : ''}`;
}
