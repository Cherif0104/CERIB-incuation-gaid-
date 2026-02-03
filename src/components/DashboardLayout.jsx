import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const navByRole = {
  SUPER_ADMIN: [
    { to: '/super-admin', label: 'Tableau de bord' },
  ],
  ADMIN_ORG: [
    { to: '/admin-org', label: 'Tableau de bord' },
    { to: '/admin-org/incubes', label: 'Incubés' },
    { to: '/admin-org/codes', label: 'Codes d\'invitation' },
    { to: '/admin-org/promotions', label: 'Promotions' },
    { to: '/admin-org/coachs', label: 'Coachs' },
    { to: '/admin-org/matrixage', label: 'Matrixage' },
    { to: '/admin-org/modules', label: 'Modules pédagogiques' },
  ],
  COACH: [
    { to: '/coach', label: 'Mes incubés' },
  ],
  CERTIFICATEUR: [
    { to: '/certificateur', label: 'Sessions de certification' },
    { to: '/certificateur/questions', label: 'Banque de questions' },
  ],
};

function DashboardLayout({ profile, children }) {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const role = profile?.role;
  const links = role ? (navByRole[role] || []) : [];
  const fullName = profile?.full_name || profile?.email || 'Utilisateur';

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-cerip-forest-light">
      {/* Overlay mobile */}
      <button
        type="button"
        aria-label="Fermer le menu"
        className="fixed inset-0 z-20 bg-black/30 md:hidden"
        style={{ display: sidebarOpen ? 'block' : 'none' }}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-30 w-64 flex flex-col bg-white border-r border-cerip-forest/10 transform transition-transform duration-200 ease-out md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-14 px-4 border-b border-cerip-forest/10">
          <Link to={links[0]?.to || '/'} className="flex items-center gap-2">
            <img src="/logo-cerip-senegal.png" alt="CERIP" className="h-8 w-auto object-contain" />
            <span className="font-semibold text-cerip-forest text-sm">Savana</span>
          </Link>
          <button
            type="button"
            className="md:hidden p-2 text-cerip-forest"
            onClick={() => setSidebarOpen(false)}
            aria-label="Fermer le menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
          {links.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-cerip-forest/80 hover:bg-cerip-forest/5 hover:text-cerip-forest"
              onClick={() => setSidebarOpen(false)}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-cerip-forest/10 space-y-1">
          <p className="px-3 py-1 text-xs text-cerip-forest/60 truncate" title={fullName}>{fullName}</p>
          <Link
            to="/profile"
            className="block w-full px-3 py-2 rounded-lg text-sm font-medium text-cerip-forest/80 hover:bg-cerip-forest/5 hover:text-cerip-forest transition text-center"
            onClick={() => setSidebarOpen(false)}
          >
            Mon profil
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full px-3 py-2 rounded-lg text-sm font-medium text-cerip-magenta hover:bg-cerip-magenta-light transition"
          >
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 flex items-center px-4 border-b border-cerip-forest/10 bg-white md:px-6">
          <button
            type="button"
            className="md:hidden p-2 -ml-2 text-cerip-forest"
            onClick={() => setSidebarOpen(true)}
            aria-label="Ouvrir le menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
        </header>
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
