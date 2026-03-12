import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useIncubePortal } from '../../hooks/useIncubePortal';
import { getNiveauBadge } from './incubeUtils';
import IncubeHeader from './IncubeHeader';
import IncubeSidebar from './IncubeSidebar';

function IncubeLayout({ profile, onRefreshProfile, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMois, setActiveMois] = useState(1);

  const data = useIncubePortal(profile, onRefreshProfile);
  const {
    coachName,
    moisValidated,
    loadError,
    moisList,
    retryLoad,
    pendingCount,
    rdvCount,
    promotionNames,
  } = data;

  useEffect(() => {
    const stateMois = location.state?.mois;
    if (stateMois && moisList.includes(stateMois)) {
      setActiveMois(stateMois);
    }
  }, [location.state?.mois, moisList]);

  useEffect(() => {
    if (moisList.length > 0 && !moisList.includes(activeMois)) {
      setActiveMois(moisList[0]);
    }
  }, [moisList, activeMois]);

  const handleMoisChange = (num) => {
    setActiveMois(num);
    if (location.pathname !== '/incube') {
      navigate('/incube', { state: { mois: num }, replace: true });
    }
  };

  const handleToolboxOpen = () => navigate('/incube/toolbox');
  const handleCoachOpen = () => navigate('/incube/coach');

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout?.();
    navigate('/login', { replace: true });
  };

  const niveau = getNiveauBadge(profile);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gradient-to-b from-cerip-forest-light via-cerip-forest-light to-cerip-forest/5">
      <IncubeHeader
        profile={profile}
        niveau={niveau}
        onLogout={handleLogout}
        onMenuToggle={() => setSidebarOpen((o) => !o)}
        sidebarOpen={sidebarOpen}
      />
      <div className="flex flex-1 min-h-0">
        <IncubeSidebar
          profile={profile}
          activeMois={activeMois}
          moisList={moisList}
          moisValidated={moisValidated}
          promotionNames={promotionNames}
          onMoisChange={handleMoisChange}
          onToolboxOpen={handleToolboxOpen}
          onCoachOpen={handleCoachOpen}
          onClose={() => setSidebarOpen(false)}
          sidebarOpen={sidebarOpen}
          pendingCoachingCount={pendingCount}
          rdvCount={rdvCount}
        />
        <main className="flex-1 min-h-0 min-w-0 overflow-auto">
          <Outlet context={{ profile, onRefreshProfile, onLogout, ...data, activeMois, setActiveMois }} />
        </main>
      </div>
    </div>
  );
}

export default IncubeLayout;
