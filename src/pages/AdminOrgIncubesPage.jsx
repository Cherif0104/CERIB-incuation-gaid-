import React, { useEffect, useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import MetricCard from '../components/MetricCard';

const STATUS_LABELS = {
  P1_EN_COURS: 'P1 en cours',
  P2_EN_COURS: 'P2 en cours',
  READY_FOR_REVIEW: 'En attente validation',
  COACH_VALIDATED: 'Validé (Clé 1)',
  SESSION_SCHEDULED: 'Session programmée',
  EXAM_IN_PROGRESS: 'Examen en cours',
  CERTIFIED: 'Certifié',
  FAILED: 'Non certifié',
};

function AdminOrgIncubesPage() {
  const { profile } = useOutletContext() ?? {};
  const orgId = profile?.organisation_id;
  const [incubes, setIncubes] = useState([]);
  const [assignations, setAssignations] = useState([]);
  const [progressCounts, setProgressCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!orgId) {
      setLoading(false);
      return;
    }
    const load = async () => {
      setLoading(true);
      setError(null);
      const { data: incData, error: incErr } = await supabase
        .from('incubes')
        .select('id, full_name, email, current_parcours, p1_score, p2_score, global_status')
        .eq('organisation_id', orgId)
        .order('full_name');
      if (incErr) {
        setError(incErr.message);
        setIncubes([]);
        setLoading(false);
        return;
      }
      setIncubes(incData ?? []);

      const incubeIds = (incData ?? []).map((i) => i.id);
      const [assignRes, progressRes] = await Promise.all([
        supabase
          .from('assignations')
          .select('incube_id, promotion_id, coach_id, promotions(name), staff_users(full_name)')
          .eq('organisation_id', orgId),
        incubeIds.length > 0
          ? supabase
              .from('incube_module_progress')
              .select('incube_id')
              .not('completed_at', 'is', null)
          : { data: [] },
      ]);

      const assignList = assignRes.data ?? [];
      const byIncube = {};
      assignList.forEach((a) => {
        if (!byIncube[a.incube_id]) byIncube[a.incube_id] = { promotions: [], coachs: [] };
        if (a.promotions?.name && !byIncube[a.incube_id].promotions.includes(a.promotions.name)) {
          byIncube[a.incube_id].promotions.push(a.promotions.name);
        }
        if (a.staff_users?.full_name && !byIncube[a.incube_id].coachs.includes(a.staff_users.full_name)) {
          byIncube[a.incube_id].coachs.push(a.staff_users.full_name);
        }
      });
      setAssignations(byIncube);

      const progressList = progressRes.data ?? [];
      const countByIncube = {};
      progressList.forEach((p) => {
        countByIncube[p.incube_id] = (countByIncube[p.incube_id] || 0) + 1;
      });
      setProgressCounts(countByIncube);
      setLoading(false);
    };
    load();
  }, [orgId]);

  if (!orgId) {
    return (
      <div className="flex-1 flex flex-col">
        <header className="px-6 py-4 border-b border-cerip-forest/10 bg-white">
          <h1 className="text-lg font-semibold text-cerip-forest">Incubés</h1>
        </header>
        <main className="flex-1 p-6">
          <p className="text-sm text-cerip-forest/70">Organisation non définie.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <header className="px-6 py-5 border-b border-cerip-forest/10 bg-white shadow-sm">
        <h1 className="text-2xl font-bold text-cerip-forest">Incubés</h1>
        <p className="text-sm text-cerip-forest/70 mt-1">
          Aperçu du niveau d&apos;avancement des incubés de votre organisation — parcours, scores et modules complétés.
        </p>
      </header>
      <main className="flex-1 p-6 space-y-6">
        {error && (
          <div className="rounded-xl bg-cerip-magenta-light border border-cerip-magenta/30 text-cerip-magenta-dark text-sm px-4 py-3">
            {error}
          </div>
        )}
        {!error && (
          <>
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
              <MetricCard label="Incubés" value={incubes.length} subText="Dans l'organisation" animationDelay={0} />
            </div>
            <section className="bg-white rounded-2xl shadow-sm border border-cerip-forest/10 overflow-hidden">
              <h2 className="text-base font-semibold text-cerip-forest px-5 py-4 border-b border-cerip-forest/10">
                Liste et avancement
              </h2>
              {loading ? (
                <div className="p-8 text-center text-cerip-forest/70 text-sm">Chargement…</div>
              ) : incubes.length === 0 ? (
                <div className="p-8 text-center text-cerip-forest/70 text-sm">
                  Aucun incubé dans cette organisation. Utilisez les <Link to="/admin-org/codes" className="text-cerip-lime hover:underline">codes d&apos;invitation</Link> pour enrôler.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-cerip-forest/10 bg-cerip-forest-light/50">
                        <th className="text-left px-4 py-3 font-medium text-cerip-forest">Incubé</th>
                        <th className="text-left px-4 py-3 font-medium text-cerip-forest">Promotion(s)</th>
                        <th className="text-left px-4 py-3 font-medium text-cerip-forest">Coach(s)</th>
                        <th className="text-left px-4 py-3 font-medium text-cerip-forest">Parcours</th>
                        <th className="text-left px-4 py-3 font-medium text-cerip-forest">Score P1 / P2</th>
                        <th className="text-left px-4 py-3 font-medium text-cerip-forest">Modules complétés</th>
                        <th className="text-left px-4 py-3 font-medium text-cerip-forest">Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {incubes.map((incube) => {
                        const assign = assignations[incube.id] || { promotions: [], coachs: [] };
                        const modulesDone = progressCounts[incube.id] ?? 0;
                        return (
                          <tr key={incube.id} className="border-b border-cerip-forest/5 hover:bg-cerip-forest-light/30">
                            <td className="px-4 py-3">
                              <p className="font-medium text-cerip-forest">{incube.full_name}</p>
                              <p className="text-xs text-cerip-forest/70">{incube.email}</p>
                            </td>
                            <td className="px-4 py-3 text-cerip-forest/80 text-xs">
                              {assign.promotions.length ? assign.promotions.join(', ') : '—'}
                            </td>
                            <td className="px-4 py-3 text-cerip-forest/80 text-xs">
                              {assign.coachs.length ? assign.coachs.join(', ') : '—'}
                            </td>
                            <td className="px-4 py-3 text-cerip-forest/80">{incube.current_parcours ?? '—'}</td>
                            <td className="px-4 py-3 text-cerip-forest/80 tabular-nums">
                              {incube.p1_score != null ? `${incube.p1_score} %` : '—'} / {incube.p2_score != null ? `${incube.p2_score} %` : '—'}
                            </td>
                            <td className="px-4 py-3 text-cerip-forest/80 tabular-nums">{modulesDone}</td>
                            <td className="px-4 py-3">
                              <span className="text-xs font-medium text-cerip-forest/80">
                                {STATUS_LABELS[incube.global_status] ?? incube.global_status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default AdminOrgIncubesPage;
