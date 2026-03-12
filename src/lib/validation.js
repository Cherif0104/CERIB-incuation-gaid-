/**
 * Helpers de validation légers pour les formulaires SAVANA.
 * Pas de lib externe (Zod/Yup) pour rester léger.
 */

export function validateEmail(value) {
  if (!value || typeof value !== 'string') return 'Adresse e-mail requise';
  const trimmed = value.trim();
  if (!trimmed) return 'Adresse e-mail requise';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) return 'Adresse e-mail invalide';
  return null;
}

export function validateRequired(value, fieldName = 'Champ') {
  if (value == null || (typeof value === 'string' && !value.trim())) {
    return `${fieldName} requis`;
  }
  return null;
}
