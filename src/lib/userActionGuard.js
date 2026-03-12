/**
 * Garde contre les déconnexions intempestives pendant une action utilisateur.
 * Quand create-platform-user ou une opération critique est en cours, on évite
 * de déclencher signOut sur une erreur auth (ex. refresh_token 400) qui peut
 * être un faux positif ou une race condition.
 */
let userActionUntil = 0;

export function startUserActionGuard(durationMs = 5000) {
  userActionUntil = Date.now() + durationMs;
}

export function isUserActionInProgress() {
  return Date.now() < userActionUntil;
}
