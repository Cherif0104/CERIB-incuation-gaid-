/**
 * LOGIQUE IA — VALIDATION ET CORRECTION MISSION 5
 */

import { MISSION_5_CONFIG } from '../mission5-prototype.js';

export function validateComprehensionTest(answers) {
  const questions = MISSION_5_CONFIG.comprehensionTest.questions;
  const passingScore = MISSION_5_CONFIG.comprehensionTest.passingScore;
  
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
    feedback: passed ? MISSION_5_CONFIG.comprehensionTest.feedback.success : MISSION_5_CONFIG.comprehensionTest.feedback.failure,
    corrections
  };
}

export function validateProjectForm(formData) {
  const errors = [];
  if (!formData.prototype_description || formData.prototype_description.length < 50) {
    errors.push('La description du prototype doit contenir au moins 50 caractères');
  }
  return { valid: errors.length === 0, errors, warnings: [] };
}

export function generatePrototypeSynthesis(formData) {
  return `Prototype : ${formData.prototype_description.substring(0, 150)}${formData.prototype_description.length > 150 ? '...' : ''}`;
}
