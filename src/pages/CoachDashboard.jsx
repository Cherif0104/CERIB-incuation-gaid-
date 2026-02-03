import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const STATUS_LABELS = {
  P1_EN_COURS: 'P1 en cours',
  P2_EN_COURS: 'P2 en cours',
  READY_FOR_REVIEW: 'En attente de validation',
  COACH_VALIDATED: 'Validé (Clé 1)',
  SESSION_SCHEDULED: 'Session programmée',
  EXAM_IN_PROGRESS: 'Examen en cours',
  CERTIFIED: 'Certifié',
  FAILED: 'Non certifié',
};

function CoachDashboard({ profile }) {
  const [rows, setRows] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [validatingId, setValidatingId] = useState(null);

  const fetchAssignations = async () => {
    if (!profile?.id) return;
    setLoading(true);
    setError(null);
    const { data: assignations, error: e1 } = await supabase
      .from('assignations')
      .select('id, incube_id, promotion_id, promotions(name)')
      .eq('coach_id', profile.id);
    if (e1) {
      setError(e1.message);
      setRows([]);
      setLoading(false);
      return;
    }
    if (!assignations?.length) {
      setRows([]);
      setLoading(false);
      return;
    }
    const incubeIds = [...new Set(assignations.map((a) => a.incube_id))];
    const { data: incubes, error: e2 } = await supabase
      .from('incubes')
      .select('id, full_name, email, current_parcours, p1_score, p2_score, global_status, organisation_id')
      .in('id', incubeIds);
    if (e2) {
      setError(e2.message);
      setRows([]);
      setLoading(false);
      return;
    }
    const incubeMap = Object.fromEntries((incubes || []).map((i) => [i.id, i]));
    const list = assignations.map((a) => ({
      ...a,
      incube: incubeMap[a.incube_id],
    })).filter((r) => r.incube);
    setRows(list);
    setLoading(false);
  };

  const fetchCoachingRequests = async () => {
    if (!profile?.id) return;
    const { data, error: err } = await supabase
      .from('coaching_requests')
      .select('id, incube_id, message, created_at, incubes(full_name, email)')
      .eq('coach_id', profile.id)
      .eq('status', 'PENDING')
      .order('created_at', { ascending: false });
    if (!err) setRequests(data || []);
  };

  useEffect(() => {
    if (profile?.id) {
      fetchAssignations();
      fetchCoachingRequests();
    }
  }, [profile?.id]);

  const handleAutoriserCertification = async (incube) => {
    if (!incube || !profile?.id) return;
    const canValidate = !['COACH_VALIDATED', 'SESSION_SCHEDULED', 'EXAM_IN_PROGRESS', 'CERTIFIED', 'FAILED'].includes(incube.global_status);
    if (!canValidate) return;
    setValidatingId(incube.id);
    setError(null);
    const { error: upErr } = await supabase.from('incubes').update({ global_status: 'COACH_VALIDATED' }).eq('id', incube.id);
    if (upErr) {
      setError(upErr.message);
      setValidatingId(null);
      return;
    }
    const { error: insErr } = await supabase.from('certification_candidates').insert({
      incube_id: incube.id,
      organisation_id: incube.organisation_id,
      coach_id: profile.id,
      coach_validation_at: new Date().toISOString(),
      exam_status: 'PENDING',
    });
    if (insErr) {
      setError(insErr.message);
    }
    await fetchAssignations();
    setValidatingId(null);
  };

  const handleMarquerTraite = async (requestId) => {
    const { error: err } = await supabase.from('coaching_requests').update({ status: 'ACCEPTED', responded_at: new Date().toISOString() }).eq('id', requestId);
    if (!err) fetchCoachingRequests();
  };

  const canValidate = (incube) => incube && !['COACH_VALIDATED', 'SESSION_SCHEDULED', 'EXAM_IN_PROGRESS', 'CERTIFIED', 'FAILED'].includes(incube.global_status);

  return (
    <div className="flex-1 flex flex-col">
      <header className="px-6 py-4 border-b border-cerip-forest/10 bg-white">
        <h1 className="text-lg font-semibold text-cerip-forest">
          Coach – Cockpit pédagogique
        </h1>
        <p className="text-xs text-cerip-forest/70">
          Vision sur vos incubés assignés, progression P1/P2 et autorisation à la certification (Clé 1).
        </p>
      </header>
      <main className="flex-1 p-6 space-y-6">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm px-4 py-3">
            {error}
          </div>
        )}

        {requests.length > 0 && (
          <section className="bg-white rounded-xl shadow-sm border border-cerip-forest/5 overflow-hidden">
            <h2 className="text-sm font-semibold text-cerip-forest px-4 py-3 border-b border-cerip-forest/10">
              Demandes de coaching (levée de main)
            </h2>
            <ul className="divide-y divide-cerip-forest/5">
              {requests.map((r) => (
                <li key={r.id} className="px-4 py-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-cerip-forest">{r.incubes?.full_name ?? r.incube_id}</p>
                    <p className="text-xs text-cerip-forest/70">{r.incubes?.email} · {new Date(r.created_at).toLocaleDateString('fr-FR')}</p>
                    {r.message && <p className="text-xs text-cerip-forest/80 mt-1">{r.message}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleMarquerTraite(r.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-cerip-forest/10 text-cerip-forest hover:bg-cerip-forest/20 transition"
                  >
                    Marquer comme traité
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="bg-white rounded-xl shadow-sm border border-cerip-forest/5 overflow-hidden">
          <h2 className="text-sm font-semibold text-cerip-forest px-4 py-3 border-b border-cerip-forest/10">
            Mes incubés
          </h2>
          {loading ? (
            <div className="p-6 text-center text-cerip-forest/70 text-sm">Chargement…</div>
          ) : rows.length === 0 ? (
            <div className="p-6 text-center text-cerip-forest/70 text-sm">Aucun incubé assigné. L’Admin Org doit faire le matrixage (Incubé + Promotion + Coach).</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-cerip-forest/10 bg-cerip-forest-light/50">
                    <th className="text-left px-4 py-3 font-medium text-cerip-forest">Incubé</th>
                    <th className="text-left px-4 py-3 font-medium text-cerip-forest">Promotion</th>
                    <th className="text-left px-4 py-3 font-medium text-cerip-forest">Parcours</th>
                    <th className="text-left px-4 py-3 font-medium text-cerip-forest">Scores P1 / P2</th>
                    <th className="text-left px-4 py-3 font-medium text-cerip-forest">Statut</th>
                    <th className="text-right px-4 py-3 font-medium text-cerip-forest">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-b border-cerip-forest/5 hover:bg-cerip-forest-light/30">
                      <td className="px-4 py-3">
                        <p className="font-medium text-cerip-forest">{row.incube?.full_name}</p>
                        <p className="text-xs text-cerip-forest/70">{row.incube?.email}</p>
                      </td>
                      <td className="px-4 py-3 text-cerip-forest/80">{row.promotions?.name ?? row.promotion_id}</td>
                      <td className="px-4 py-3 text-cerip-forest/80">{row.incube?.current_parcours ?? '—'}</td>
                      <td className="px-4 py-3 text-cerip-forest/80">
                        {row.incube?.p1_score != null ? `${row.incube.p1_score} %` : '—'} / {row.incube?.p2_score != null ? `${row.incube.p2_score} %` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium text-cerip-forest/80">
                          {STATUS_LABELS[row.incube?.global_status] ?? row.incube?.global_status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {canValidate(row.incube) ? (
                          <button
                            type="button"
                            disabled={validatingId === row.incube.id}
                            onClick={() => handleAutoriserCertification(row.incube)}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-cerip-lime text-white hover:bg-cerip-lime-dark disabled:opacity-50 transition"
                          >
                            {validatingId === row.incube.id ? 'En cours…' : 'Autoriser certification'}
                          </button>
                        ) : (
                          <span className="text-xs text-cerip-forest/60">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default CoachDashboard;
