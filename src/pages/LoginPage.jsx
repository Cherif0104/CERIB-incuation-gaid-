import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import LoadingOverlay from '../components/LoadingOverlay';
import { TEST_ACCOUNTS, TEST_ACCOUNTS_PASSWORD } from '../data/testAccounts';

/* Icône lion (Gaindé) — savane, milieu de vie du lion */
function GaindeIcon({ className = 'w-16 h-16' }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Crinière */}
      <circle cx="32" cy="32" r="22" fill="currentColor" opacity="0.95" />
      {/* Tête */}
      <circle cx="32" cy="32" r="14" fill="currentColor" opacity="0.9" />
      {/* Oreilles */}
      <ellipse cx="22" cy="22" rx="5" ry="6" fill="currentColor" opacity="0.95" />
      <ellipse cx="42" cy="22" rx="5" ry="6" fill="currentColor" opacity="0.95" />
      {/* Yeux */}
      <circle cx="26" cy="30" r="2.5" fill="white" opacity="0.95" />
      <circle cx="38" cy="30" r="2.5" fill="white" opacity="0.95" />
      {/* Nez / bouche */}
      <path d="M30 38 Q32 42 34 38" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.9" />
    </svg>
  );
}

const OVERLAY_EXIT_MS = 220;

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [overlayExiting, setOverlayExiting] = useState(false);
  const [error, setError] = useState('');
  const [showTestAccounts, setShowTestAccounts] = useState(false);
  const exitTimeoutRef = useRef(null);

  useEffect(() => () => {
    if (exitTimeoutRef.current) clearTimeout(exitTimeoutRef.current);
  }, []);

  const fillTestAccount = (acc) => {
    setEmail(acc.email);
    setPassword(TEST_ACCOUNTS_PASSWORD);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }
    if (onLoginSuccess) {
      try {
        const path = await onLoginSuccess();
        if (path) navigate(path, { replace: true });
      } catch (err) {
        console.error('Redirection après connexion:', err);
        setError('Connexion réussie mais redirection impossible. Rechargez la page.');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row relative">
      {(loading || overlayExiting) && (
        <LoadingOverlay
          message="Connexion en cours…"
          subMessage="Vérification de vos accès Savana"
          exiting={overlayExiting}
        />
      )}
      {/* Colonne gauche : formulaire — fond dérivé du vert forêt (logo) */}
      <div className="flex-1 flex flex-col justify-center px-6 py-10 md:px-12 bg-gradient-to-b from-cerip-forest-light to-[#f8f9f8]">
        <div className="w-full max-w-md mx-auto">
          <div className="flex justify-center mb-4">
            <img
              src="/logo-cerip-senegal.png"
              alt="CERIP Sénégal"
              className="h-14 w-auto object-contain"
            />
          </div>
          <p className="text-center text-xs font-semibold text-cerip-forest/80 uppercase tracking-wider mb-6">
            Savana · Parcours Gaindé · Incubation gamifiée
          </p>

          <p className="text-center text-sm text-cerip-forest/80 mb-6">
            Pas encore de compte ?{' '}
            <Link
              to="/signup"
              className="text-cerip-magenta font-semibold hover:text-cerip-magenta-dark hover:underline"
            >
              Créer un compte
            </Link>
          </p>

          <h1 className="text-2xl md:text-3xl font-bold text-cerip-forest mb-1">
            Bienvenue
          </h1>
          <p className="text-sm text-cerip-forest/70 mb-6">
            Adresse e-mail et mot de passe pour accéder à votre espace.
          </p>

          <div className="bg-white rounded-2xl shadow-lg shadow-cerip-forest/10 border border-cerip-forest/10 p-6 md:p-7">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-cerip-forest mb-1.5 uppercase tracking-wide">
                  Adresse e-mail
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="exemple@mail.com"
                    className="w-full border border-cerip-forest/20 rounded-xl pl-3 pr-10 py-3 text-sm text-cerip-forest focus:outline-none focus:ring-2 focus:ring-cerip-lime/50 focus:border-cerip-lime transition"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-cerip-forest/50 text-sm font-medium">
                    @
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-cerip-forest mb-1.5 uppercase tracking-wide">
                  Mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="6+ caractères"
                    className="w-full border border-cerip-forest/20 rounded-xl pl-3 pr-12 py-3 text-sm text-cerip-forest focus:outline-none focus:ring-2 focus:ring-cerip-lime/50 focus:border-cerip-lime transition"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-cerip-forest/50 hover:text-cerip-forest hover:bg-cerip-forest/5 transition focus:outline-none focus:ring-2 focus:ring-cerip-lime/50"
                    aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    tabIndex={0}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              {error && (
                <p className="text-xs text-cerip-magenta-dark bg-cerip-magenta-light border border-cerip-magenta/30 rounded-xl px-3 py-2">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-cerip-lime hover:bg-cerip-lime-dark text-white font-semibold py-3 text-sm transition shadow-md hover:shadow-lg disabled:opacity-60"
              >
                {loading ? 'Connexion…' : 'Se connecter'}
              </button>
            </form>
          </div>

          {/* Comptes de test — implantés dans le projet pour tester par rôle */}
          <div className="mt-6 border border-cerip-forest/15 rounded-xl overflow-hidden bg-cerip-forest/5">
            <button
              type="button"
              onClick={() => setShowTestAccounts((s) => !s)}
              className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-medium text-cerip-forest hover:bg-cerip-forest/10 transition focus:outline-none focus:ring-2 focus:ring-cerip-lime/50 rounded-xl"
              aria-expanded={showTestAccounts}
            >
              <span>Comptes de test (développement)</span>
              <svg
                className={`w-5 h-5 text-cerip-forest/60 transition-transform ${showTestAccounts ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showTestAccounts && (
              <div className="border-t border-cerip-forest/15 px-4 py-3">
                <p className="text-xs text-cerip-forest/70 mb-2">
                  Cliquez sur un compte pour remplir le formulaire. Mot de passe commun : <code className="bg-white/80 px-1 rounded">CeripDev2025!</code>
                </p>
                <ul className="space-y-1">
                  {TEST_ACCOUNTS.map((acc) => (
                    <li key={acc.email}>
                      <button
                        type="button"
                        onClick={() => fillTestAccount(acc)}
                        className="w-full text-left px-3 py-2 rounded-lg text-sm text-cerip-forest hover:bg-cerip-lime/20 hover:text-cerip-forest transition focus:outline-none focus:ring-2 focus:ring-cerip-lime/50"
                      >
                        <span className="font-medium text-cerip-forest">{acc.label}</span>
                        <span className="block text-xs text-cerip-forest/70 truncate">{acc.email}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Colonne droite : panneau sombre + illustration lion valorisée */}
      <div className="flex-1 flex flex-col justify-center px-8 py-12 md:px-14 cerip-panel-dark text-white relative overflow-hidden">
        <div className="absolute inset-0 cerip-panel-shine pointer-events-none" aria-hidden="true" />
        <div className="relative z-10 max-w-md flex flex-col items-center md:items-start">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-cerip-lime/20 flex items-center justify-center text-cerip-lime flex-shrink-0">
              <GaindeIcon className="w-9 h-9" />
            </div>
            <div>
              <p className="text-xs font-semibold text-cerip-lime/90 uppercase tracking-wider">
                Parcours Gaindé
              </p>
              <p className="text-white/90 text-sm">De lionceau à Gaindé</p>
            </div>
          </div>

          <h2 className="text-2xl md:text-3xl font-bold leading-tight mb-2">
            De l'<span className="text-cerip-lime">idée</span> à l'entreprise.
          </h2>
          <p className="text-cerip-lime text-lg font-semibold mb-4">
            De lionceau à Gaindé.
          </p>

          <div className="flex gap-1 mb-4">
            <div className="w-1 h-14 bg-cerip-lime rounded-full" />
            <div className="w-1 h-14 bg-cerip-magenta rounded-full" />
            <div className="w-1 h-14 bg-cerip-forest-mid rounded-full" />
          </div>
          <p className="text-white/60 text-xs font-medium mb-6">
            Lionceau → Accompagnement → Gaindé
          </p>

          <p className="text-white/90 text-sm leading-relaxed mb-8">
            Accompagnement, mentorat, formation et parcours gamifié au service de votre projet.
            Structuration, coaching et transformation — de l'idée à l'entreprise durable, à Thiès.
          </p>

          <div className="flex items-center gap-3">
            <a
              href="https://cerip-senegal.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-11 h-11 rounded-xl border-2 border-cerip-magenta/50 bg-white/10 flex-shrink-0 flex items-center justify-center overflow-hidden p-1 hover:bg-white/20 transition"
              aria-label="CERIP Sénégal – site officiel"
            >
              <img src="/logo-cerip-senegal.png" alt="CERIP Sénégal" className="w-full h-full object-contain" />
            </a>
            <div>
              <p className="font-bold text-white">Savana</p>
              <p className="text-sm text-white/70">
                Plateforme du{' '}
                <a
                  href="https://cerip-senegal.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cerip-lime hover:underline"
                >
                  CERIP Sénégal
                </a>
                {' '}· Incubateur à Thiès
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
