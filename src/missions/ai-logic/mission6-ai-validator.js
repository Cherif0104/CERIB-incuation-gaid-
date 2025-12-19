/**
 * LOGIQUE IA — VALIDATION ET CORRECTION MISSION 6
 */

import { MISSION_6_CONFIG } from '../mission6-identite.js';

export function validateComprehensionTest(answers) {
  const questions = MISSION_6_CONFIG.comprehensionTest.questions;
  const passingScore = MISSION_6_CONFIG.comprehensionTest.passingScore;
  
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
    feedback: passed ? MISSION_6_CONFIG.comprehensionTest.feedback.success : MISSION_6_CONFIG.comprehensionTest.feedback.failure,
    corrections
  };
}

export function validateProjectForm(formData) {
  const errors = [];
  if (!formData.identite_marque || formData.identite_marque.length < 50) {
    errors.push('L\'identité de marque doit contenir au moins 50 caractères');
  }
  return { valid: errors.length === 0, errors, warnings: [] };
}

export function generateIdentiteSynthesis(formData) {
  return `Identité de Marque : ${formData.identite_marque.substring(0, 150)}${formData.identite_marque.length > 150 ? '...' : ''}`;
}
