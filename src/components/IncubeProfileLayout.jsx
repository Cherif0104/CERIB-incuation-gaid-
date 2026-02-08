import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

/**
 * Layout minimal pour la page Profil quand l'utilisateur est incubé (pas de DashboardLayout).
 */
function IncubeProfileLayout({ profile, children, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout?.();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-cerip-forest-light flex-col">
      <header className="h-14 flex items-center justify-between px-4 md:px-6 border-b border-cerip-forest/10 bg-white shadow-sm">
        <div className="flex items-center gap-4">
          <Link to="/incube" className="flex items-center gap-2">
            <img src="/logo-cerip-senegal.png" alt="CERIP" className="h-8 w-auto object-contain" />
            <span className="font-semibold text-cerip-forest text-sm">Savana</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link
              to="/incube"
              className="px-3 py-2 rounded-lg text-sm font-medium text-cerip-forest/70 hover:bg-cerip-forest/5 hover:text-cerip-forest transition"
            >
              Mon parcours
            </Link>
            <span className="px-3 py-2 rounded-lg text-sm font-medium bg-cerip-forest/10 text-cerip-forest">
              Mon profil
            </span>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-cerip-forest/70 truncate max-w-[120px] md:max-w-none" title={profile?.email}>
            {profile?.full_name || profile?.email}
          </span>
          <button
            type="button"
            onClick={handleLogout}
            className="px-3 py-2 rounded-lg text-sm font-medium text-cerip-magenta hover:bg-cerip-magenta-light transition"
          >
            Déconnexion
          </button>
        </div>
      </header>
      <main className="flex-1 flex flex-col min-w-0">
        {children}
      </main>
    </div>
  );
}

export default IncubeProfileLayout;
