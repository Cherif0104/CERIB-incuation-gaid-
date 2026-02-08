import React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

function OrganisationSuspendedPage({ onLogout }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (_) {
      // ignore
    }
    onLogout?.();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-cerip-forest-light">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-cerip-forest/10 p-6 text-center">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-cerip-magenta/10 flex items-center justify-center text-cerip-magenta">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M4.93 4.93l14.14 14.14M12 2a10 10 0 1010 10A10 10 0 0012 2z" />
          </svg>
        </div>
        <h1 className="text-lg font-semibold text-cerip-forest mb-2">Organisation suspendue</h1>
        <p className="text-sm text-cerip-forest/80 mb-4">
          L&apos;organisation à laquelle vous êtes rattaché·e est actuellement suspendue.
          Vous ne pouvez pas accéder à la plateforme tant qu&apos;elle n&apos;est pas réactivée par un Super Admin.
        </p>
        <p className="text-xs text-cerip-forest/70 mb-6">
          Contactez votre responsable ou l&apos;équipe CERIP pour plus d&apos;informations.
        </p>
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium bg-cerip-forest text-white hover:bg-cerip-forest/90 transition"
        >
          Se déconnecter
        </button>
      </div>
    </div>
  );
}

export default OrganisationSuspendedPage;

