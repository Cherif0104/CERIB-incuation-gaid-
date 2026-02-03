import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

function SuperAdminDashboard({ profile }) {
  const [organisations, setOrganisations] = useState([]);
  const [stats, setStats] = useState({ totalOrgs: 0, totalIncubes: 0, suspended: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      const { data: orgs, error: e1 } = await supabase
        .from('organisations')
        .select('*')
        .order('name');
      if (e1) {
        setError(e1.message);
        setLoading(false);
        return;
      }
      setOrganisations(orgs || []);

      const { count: incubeCount, error: e2 } = await supabase
        .from('incubes')
        .select('*', { count: 'exact', head: true });
      if (!e2) {
        setStats((s) => ({
          ...s,
          totalOrgs: (orgs || []).length,
          totalIncubes: incubeCount ?? 0,
          suspended: (orgs || []).filter((o) => o.is_suspended).length,
        }));
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleToggleSuspended = async (org) => {
    const { error: e } = await supabase
      .from('organisations')
      .update({ is_suspended: !org.is_suspended })
      .eq('id', org.id);
    if (e) setError(e.message);
    else setOrganisations((prev) => prev.map((o) => (o.id === org.id ? { ...o, is_suspended: !o.is_suspended } : o)));
  };

  return (
    <div className="flex-1 flex flex-col">
      <header className="px-6 py-4 border-b border-cerip-forest/10 bg-white">
        <h1 className="text-lg font-semibold text-cerip-forest">Super Admin – Vue globale</h1>
        <p className="text-xs text-cerip-forest/70 mt-0.5">Monitoring des organisations, quotas et suspension.</p>
      </header>
      <main className="flex-1 p-6 space-y-6">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm px-4 py-3">{error}</div>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <div className="bg-white rounded-xl shadow-sm border border-cerip-forest/5 p-4">
            <p className="text-xs text-cerip-forest/70 mb-1">Organisations actives</p>
            <p className="text-2xl font-semibold text-cerip-forest">{loading ? '—' : stats.totalOrgs}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-cerip-forest/5 p-4">
            <p className="text-xs text-cerip-forest/70 mb-1">Incubés totaux</p>
            <p className="text-2xl font-semibold text-cerip-forest">{loading ? '—' : stats.totalIncubes}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-cerip-forest/5 p-4">
            <p className="text-xs text-cerip-forest/70 mb-1">Organisations suspendues</p>
            <p className="text-2xl font-semibold text-cerip-forest">{loading ? '—' : stats.suspended}</p>
          </div>
        </div>

        <section className="bg-white rounded-xl shadow-sm border border-cerip-forest/5 overflow-hidden">
          <h2 className="text-sm font-semibold text-cerip-forest px-4 py-3 border-b border-cerip-forest/10">
            Liste des organisations
          </h2>
          {loading ? (
            <div className="p-6 text-center text-cerip-forest/70 text-sm">Chargement…</div>
          ) : organisations.length === 0 ? (
            <div className="p-6 text-center text-cerip-forest/70 text-sm">Aucune organisation.</div>
          ) : (
            <ul className="divide-y divide-cerip-forest/5">
              {organisations.map((o) => (
                <li key={o.id} className="px-4 py-3 flex flex-wrap items-center justify-between gap-2 hover:bg-cerip-forest-light/30">
                  <div>
                    <p className="font-medium text-cerip-forest">{o.name}</p>
                    <p className="text-xs text-cerip-forest/70">
                      {o.id} · {o.account_type} · Quotas: {o.quota_incubes} incubés, {o.quota_coachs} coachs
                      {o.is_suspended && <span className="ml-1 text-cerip-magenta font-medium">(suspendue)</span>}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleSuspended(o)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      o.is_suspended ? 'bg-cerip-lime text-white hover:bg-cerip-lime-dark' : 'bg-cerip-magenta/10 text-cerip-magenta hover:bg-cerip-magenta/20'
                    }`}
                  >
                    {o.is_suspended ? 'Réactiver' : 'Suspendre'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

export default SuperAdminDashboard;
