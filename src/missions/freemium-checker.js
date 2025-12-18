/**
 * VÉRIFICATEUR D'ACCÈS FREEMIUM
 * Gère les restrictions d'accès selon le modèle freemium
 */
import { DIAGNOSTIC_INITIAL_CONFIG, checkMissionAccess } from './diagnostic-initial.js';

export function verifyMissionAccess(parcours, numeroMission, userData = {}, onUpgrade) {
  const access = checkMissionAccess(parcours, numeroMission, userData.subscription || {});
  if (!access.accessible) {
    showBlockedMissionScreen(access, parcours, numeroMission, onUpgrade);
    return false;
  }
  return true;
}

export function showBlockedMissionScreen(accessInfo, parcours, numeroMission, onUpgrade) {
  const container = document.getElementById('app-content');
  container.innerHTML = `
    <div class="max-w-2xl mx-auto fade-in">
      <div class="bg-white rounded-xl shadow-xl border-2 border-amber-300 p-8">
        <div class="text-center mb-6">
          <div class="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-10 h-10 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
          </div>
          <h2 class="text-3xl font-bold text-slate-900 mb-2">Mission Verrouillée</h2>
          <p class="text-lg text-slate-600">Mission ${numeroMission} du Parcours "${parcours}"</p>
        </div>
        <div class="bg-slate-50 rounded-lg p-6 mb-6 border border-slate-200">
          <p class="text-slate-700 leading-relaxed mb-4">
            ${accessInfo.message || DIAGNOSTIC_INITIAL_CONFIG.monetization.message_blocage}
          </p>
        </div>
        <div class="space-y-3">
          <button onclick="handleUpgradePremium()" class="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 rounded-lg font-bold text-lg hover:from-blue-700 hover:to-indigo-700 transition shadow-lg">
            ${accessInfo.cta || 'Débloquer tout le parcours'}
          </button>
          <button onclick="goBackToDashboard()" class="w-full bg-slate-100 text-slate-700 px-6 py-3 rounded-lg font-medium hover:bg-slate-200 transition">
            Retour au tableau de bord
          </button>
        </div>
      </div>
    </div>
  `;
  window.handleUpgradePremium = () => { if (onUpgrade) onUpgrade(); else alert('Fonctionnalité premium à implémenter'); };
  window.goBackToDashboard = () => { if (window.navigateTo) window.navigateTo(null); };
}

export async function saveDiagnosticResult(userId, diagnosticResult) {
  try {
    const diagnosticData = {
      userId,
      date: new Date().toISOString(),
      mondeRecommande: diagnosticResult.mondeRecommande,
      scores: diagnosticResult.scores,
      justification: diagnosticResult.justification,
      parcoursRecommande: diagnosticResult.parcoursRecommande
    };
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(`diagnostic_${userId}`, JSON.stringify(diagnosticData));
    }
    return true;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du diagnostic:', error);
    return false;
  }
}
