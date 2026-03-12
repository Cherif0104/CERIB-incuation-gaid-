import React from 'react';
import { Link } from 'react-router-dom';
import { getNiveauBadge } from './incubeUtils';

function IncubeHeader({ profile, niveau, onLogout, onMenuToggle, sidebarOpen }) {
  const badge = niveau || getNiveauBadge(profile);
  const prenom = profile?.full_name?.trim() ? (profile.full_name.split(/\s+/)[0] || profile.full_name) : (profile?.email ?? 'Étudiant');

  return (
    <header className="shrink-0 sticky top-0 z-10 h-14 flex items-center justify-between px-4 md:px-6 rounded-b-2xl md:mx-4 bg-white/95 backdrop-blur border-b border-cerip-forest/10 shadow-sm">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onMenuToggle}
          className="md:hidden p-2 rounded-lg text-cerip-forest hover:bg-cerip-forest/10"
          aria-label="Menu"
          aria-expanded={sidebarOpen}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <Link to="/incube" className="flex items-center gap-2">
          <img src="/logo-cerip-senegal.png" alt="CERIP" className="h-8 w-auto object-contain" />
          <span className="font-bold text-cerip-forest text-sm">Savana</span>
        </Link>
      </div>
      <div className="flex items-center gap-2 md:gap-3">
        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold shadow-sm ${badge.color}`} title="Ton niveau">
          {badge.label}
        </span>
        <span className="text-xs text-cerip-forest/60 truncate max-w-[100px] md:max-w-[160px]" title={profile?.email}>
          {prenom}
        </span>
        <Link to="/profile" className="px-2 py-1.5 rounded-lg text-xs font-medium text-cerip-forest/80 hover:bg-cerip-forest/10" aria-label="Mon profil">
          Profil
        </Link>
        <button type="button" onClick={onLogout} className="px-2 py-1.5 rounded-lg text-xs font-medium text-cerip-magenta hover:bg-cerip-magenta-light" aria-label="Déconnexion">
          Sortir
        </button>
      </div>
    </header>
  );
}

export default IncubeHeader;
