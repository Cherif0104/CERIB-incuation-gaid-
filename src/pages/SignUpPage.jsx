import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Page d'inscription : accès contrôlé par invitation uniquement.
 * - Staff (Admin, Coach, Certificateur) : créés en interne, pas d'auto-inscription.
 * - Incubés : rejoignent via un code d'invitation fourni par leur organisation.
 */
function SignUpPage() {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <div className="flex-1 flex flex-col justify-center px-6 py-10 md:px-12 bg-gradient-to-b from-cerip-forest-light to-[#f8f9f8]">
        <div className="w-full max-w-md mx-auto">
          <div className="flex justify-center mb-4">
            <img src="/logo-cerip-senegal.png" alt="CERIP Sénégal" className="h-14 w-auto object-contain" />
          </div>
          <p className="text-center text-xs font-semibold text-cerip-forest/80 uppercase tracking-wider mb-6">
            Savana · Parcours Gaindé
          </p>

          <h1 className="text-2xl md:text-3xl font-bold text-cerip-forest mb-3">
            Inscription sur Savana
          </h1>
          <p className="text-sm text-cerip-forest/70 mb-6">
            L'accès à la plateforme se fait <strong>sur invitation</strong> pour garantir la sécurité,
            le bon suivi des rôles et éviter les usurpations.
          </p>

          <div className="bg-white rounded-2xl shadow-lg shadow-cerip-forest/10 border border-cerip-forest/10 p-6 md:p-7 space-y-4">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-xl bg-cerip-lime/20 flex items-center justify-center flex-shrink-0 text-cerip-lime">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </div>
              <div>
                <p className="font-semibold text-cerip-forest text-sm">Incubé(e) ?</p>
                <p className="text-xs text-cerip-forest/70">Votre organisation (CERIP ou votre incubateur) vous enverra un <strong>code d'invitation</strong>. Utilisez-le pour créer votre compte.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-xl bg-cerip-forest/10 flex items-center justify-center flex-shrink-0 text-cerip-forest">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              </div>
              <div>
                <p className="font-semibold text-cerip-forest text-sm">Admin, Coach ou Certificateur ?</p>
                <p className="text-xs text-cerip-forest/70">Les comptes sont créés en interne. Connectez-vous avec les identifiants qui vous ont été fournis.</p>
              </div>
            </div>

            <div className="pt-4 border-t border-cerip-forest/10 space-y-3">
              <Link
                to="/accept-invitation"
                className="block w-full text-center rounded-xl bg-cerip-lime hover:bg-cerip-lime-dark text-white font-semibold py-3 text-sm transition shadow-md hover:shadow-lg"
              >
                J'ai reçu une invitation (code)
              </Link>
              <p className="text-center text-sm text-cerip-forest/70">
                Déjà un compte ?{' '}
                <Link to="/login" className="text-cerip-magenta font-semibold hover:underline">
                  Se connecter
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center px-8 py-12 md:px-14 cerip-panel-dark text-white relative overflow-hidden">
        <div className="absolute inset-0 cerip-panel-shine pointer-events-none" />
        <div className="relative z-10 max-w-md">
          <h2 className="text-2xl md:text-3xl font-bold leading-tight mb-2">
            De l'<span className="text-cerip-lime">idée</span> à l'entreprise.
          </h2>
          <p className="text-cerip-lime text-lg font-semibold mb-4">De lionceau à Gaindé.</p>
          <div className="flex gap-1 mb-4">
            <div className="w-1 h-14 bg-cerip-lime rounded-full" />
            <div className="w-1 h-14 bg-cerip-magenta rounded-full" />
            <div className="w-1 h-14 bg-cerip-forest-mid rounded-full" />
          </div>
          <p className="text-white/90 text-sm leading-relaxed mb-8">
            Accompagnement, mentorat, formation et parcours gamifié. Un accès contrôlé pour un suivi de qualité.
          </p>
          <div className="flex items-center gap-3">
            <a href="https://cerip-senegal.com/" target="_blank" rel="noopener noreferrer" className="w-11 h-11 rounded-xl border-2 border-cerip-magenta/50 bg-white/10 flex-shrink-0 flex items-center justify-center overflow-hidden p-1 hover:bg-white/20 transition" aria-label="CERIP Sénégal">
              <img src="/logo-cerip-senegal.png" alt="CERIP Sénégal" className="w-full h-full object-contain" />
            </a>
            <div>
              <p className="font-bold text-white">Savana</p>
              <p className="text-sm text-white/70">Plateforme du <a href="https://cerip-senegal.com/" target="_blank" rel="noopener noreferrer" className="text-cerip-lime hover:underline">CERIP Sénégal</a> · Incubateur à Thiès</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignUpPage;
