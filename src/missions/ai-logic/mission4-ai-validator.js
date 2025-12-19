/**
 * LOGIQUE IA — VALIDATION ET CORRECTION MISSION 4
 */

import { MISSION_4_CONFIG } from '../mission4-modele.js';

export function validateComprehensionTest(answers) {
  const questions = MISSION_4_CONFIG.comprehensionTest.questions;
  const passingScore = MISSION_4_CONFIG.comprehensionTest.passingScore;
  
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
    feedback: passed ? MISSION_4_CONFIG.comprehensionTest.feedback.success : MISSION_4_CONFIG.comprehensionTest.feedback.failure,
    corrections
  };
}

export function validateProjectForm(formData) {
  const errors = [];
  if (!formData.modele_economique || formData.modele_economique.length < 50) {
    errors.push('Le modèle économique doit contenir au moins 50 caractères');
  }
  return { valid: errors.length === 0, errors, warnings: [] };
}

export function generateModeleSynthesis(formData) {
  return `Modèle Économique : ${formData.modele_economique.substring(0, 150)}${formData.modele_economique.length > 150 ? '...' : ''}`;
}
