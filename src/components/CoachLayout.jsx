import React, { useEffect, useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

/**
 * Layout Coach : sidebar DEMANDES & ALERTES avec liste [Étudiant] Mois X, zone principale = Outlet.
 */
function CoachLayout({ profile, onLogout }) {
  const navigate = useNavigate();
  const [demandesList, setDemandesList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) {
      setLoading(false);
      return;
    }
    const load = async () => {
      try {
        const { data: assignations } = await supabase
          .from('assignations')
          .select('id, incube_id, promotion_id, promotions(name)')
          .eq('coach_id', profile.id);
        if (!assignations?.length) {
          setDemandesList([]);
          setLoading(false);
          return;
        }
        const incubeIds = [...new Set(assignations.map((a) => a.incube_id))];
        const { data: incubes } = await supabase
          .from('incubes')
          .select('id, full_name, email')
          .in('id', incubeIds);
        const incubeMap = Object.fromEntries((incubes ?? []).map((i) => [i.id, i]));
        const { data: requests } = await supabase
          .from('coaching_requests')
          .select('incube_id, mois_num')
          .eq('coach_id', profile.id)
          .eq('status', 'PENDING');
        const moisByIncube = {};
        (requests ?? []).forEach((r) => {
          if (r.mois_num != null) moisByIncube[r.incube_id] = r.mois_num;
        });
        const byIncube = {};
        assignations.forEach((a) => {
          if (byIncube[a.incube_id]) return;
          const incube = incubeMap[a.incube_id];
          const mois = moisByIncube[a.incube_id] ?? 1;
          byIncube[a.incube_id] = {
            incube_id: a.incube_id,
            full_name: incube?.full_name ?? a.incube_id,
            email: incube?.email,
            mois_num: mois,
          };
        });
        setDemandesList(Object.values(byIncube));
      } catch (err) {
        console.error('CoachLayout load:', err);
        setDemandesList([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [profile?.id]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout?.();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-cerip-forest-light">
      <aside className="w-56 shrink-0 bg-cerip-forest/95 text-white flex flex-col p-3">
        <div className="flex items-center gap-2 mb-4">
          <Link to="/coach" className="flex items-center gap-2">
            <img src="/logo-cerip-senegal.png" alt="CERIP" className="h-8 w-auto object-contain" />
            <span className="font-semibold text-cerip-lime text-sm">Savana</span>
          </Link>
        </div>
        <p className="text-white/90 font-semibold text-sm uppercase tracking-wider px-2 mb-2">COACH</p>
        <div className="bg-cerip-magenta/20 text-white rounded-lg px-3 py-2 mb-3">
          <p className="text-sm font-semibold">DEMANDES & ALERTES</p>
        </div>
        {loading ? (
          <p className="text-white/70 text-xs px-2">Chargement…</p>
        ) : (
          <ul className="space-y-1 overflow-y-auto">
            {demandesList.length === 0 ? (
              <li className="text-white/70 text-xs px-2">Aucun incubé assigné.</li>
            ) : (
              demandesList.map((item) => (
                <li key={`${item.incube_id}-${item.mois_num}`}>
                  <Link
                    to={`/coach/incubes/${item.incube_id}`}
                    className="block px-3 py-2 rounded-lg text-sm font-medium text-white hover:bg-white/10 flex items-center justify-between gap-2"
                  >
                    <span className="truncate">{item.full_name}</span>
                    <span className="text-xs shrink-0">Mois {item.mois_num}</span>
                  </Link>
                </li>
              ))
            )}
          </ul>
        )}
        <div className="mt-auto pt-4 border-t border-white/20">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full px-3 py-2 rounded-lg text-sm font-medium text-cerip-magenta bg-white/10 hover:bg-white/20"
          >
            Déconnexion
          </button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 overflow-auto">
          <Outlet context={{ profile }} />
        </main>
      </div>
    </div>
  );
}

export default CoachLayout;
