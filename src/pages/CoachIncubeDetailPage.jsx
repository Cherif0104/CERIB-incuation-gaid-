import React, { useEffect, useState } from 'react';
import { Link, useParams, useOutletContext } from 'react-router-dom';
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

function CoachIncubeDetailPage() {
  const { incubeId } = useParams();
  const { profile } = useOutletContext() ?? {};
  const [incube, setIncube] = useState(null);
  const [promotions, setPromotions] = useState([]);
  const [modules, setModules] = useState([]);
  const [progress, setProgress] = useState({});
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [validating, setValidating] = useState(false);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    if (!profile?.id || !incubeId) {
      setLoading(false);
      return;
    }
    const load = async () => {
      setLoading(true);
      setError(null);
      setForbidden(false);
      const { data: assignations } = await supabase
        .from('assignations')
        .select('id, promotion_id, promotions(name)')
        .eq('coach_id', profile.id)
        .eq('incube_id', incubeId);
      if (!assignations?.length) {
        setForbidden(true);
        setIncube(null);
        setLoading(false);
        return;
      }
      const { data: incubeData, error: incErr } = await supabase
        .from('incubes')
        .select('id, full_name, email, current_parcours, p1_score, p2_score, global_status, organisation_id')
        .eq('id', incubeId)
        .single();
      if (incErr || !incubeData) {
        setError(incErr?.message || 'Incubé introuvable.');
        setIncube(null);
        setLoading(false);
        return;
      }
      setIncube(incubeData);
      setPromotions(assignations.map((a) => a.promotions?.name || a.promotion_id).filter(Boolean));

      const orgId = incubeData.organisation_id;
      const parcours = incubeData.current_parcours || 'P1';
      const [modsRes, progRes, reqRes] = await Promise.all([
        supabase
          .from('learning_modules')
          .select('id, title, type, parcours_phase, sort_order')
          .or(`organisation_id.eq.${orgId},organisation_id.is.null`)
          .or(`parcours_phase.eq.${parcours},parcours_phase.eq.P3`)
          .order('sort_order'),
        supabase
          .from('incube_module_progress')
          .select('module_id, completed_at, score_pct')
          .eq('incube_id', incubeId),
        supabase
          .from('coaching_requests')
          .select('id, message, status, created_at, responded_at')
          .eq('incube_id', incubeId)
          .eq('coach_id', profile.id)
          .order('created_at', { ascending: false }),
      ]);
      setModules(modsRes.data ?? []);
      const byModule = {};
      (progRes.data ?? []).forEach((p) => { byModule[p.module_id] = p; });
      setProgress(byModule);
      setRequests(reqRes.data ?? []);
      setLoading(false);
    };
    load();
  }, [profile?.id, incubeId]);

  const handleAutoriserCertification = async () => {
    if (!incube || !profile?.id) return;
    const canValidate = !['COACH_VALIDATED', 'SESSION_SCHEDULED', 'EXAM_IN_PROGRESS', 'CERTIFIED', 'FAILED'].includes(incube.global_status);
    if (!canValidate) return;
    setValidating(true);
    setError(null);
    const { error: upErr } = await supabase.from('incubes').update({ global_status: 'COACH_VALIDATED' }).eq('id', incube.id);
    if (upErr) {
      setError(upErr.message);
      setValidating(false);
      return;
    }
    await supabase.from('certification_candidates').insert({
      incube_id: incube.id,
      organisation_id: incube.organisation_id,
      coach_id: profile.id,
      coach_validation_at: new Date().toISOString(),
      exam_status: 'PENDING',
    });
    setIncube((prev) => (prev ? { ...prev, global_status: 'COACH_VALIDATED' } : null));
    setValidating(false);
  };

  const canValidate = incube && !['COACH_VALIDATED', 'SESSION_SCHEDULED', 'EXAM_IN_PROGRESS', 'CERTIFIED', 'FAILED'].includes(incube.global_status);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col p-6">
        <p className="text-cerip-forest/70 text-sm">Chargement…</p>
      </div>
    );
  }
  if (forbidden) {
    return (
      <div className="flex-1 flex flex-col p-6">
        <p className="text-cerip-magenta font-medium">Vous n’êtes pas assigné à cet incubé.</p>
        <Link to="/coach" className="mt-2 text-sm text-cerip-lime hover:underline">Retour au tableau de bord</Link>
      </div>
    );
  }
  if (!incube) {
    return (
      <div className="flex-1 flex flex-col p-6">
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <Link to="/coach" className="mt-2 text-sm text-cerip-lime hover:underline">Retour au tableau de bord</Link>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <header className="px-6 py-4 border-b border-cerip-forest/10 bg-white">
        <Link to="/coach" className="text-xs text-cerip-forest/70 hover:text-cerip-forest mb-1 inline-block">← Tableau de bord</Link>
        <h1 className="text-lg font-semibold text-cerip-forest">Fiche incubé</h1>
        <p className="text-sm font-medium text-cerip-forest mt-1">{incube.full_name}</p>
        <p className="text-xs text-cerip-forest/70">{incube.email}</p>
      </header>
      <main className="flex-1 p-6 space-y-6">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm px-4 py-3">{error}</div>
        )}

        <section className="bg-white rounded-xl shadow-sm border border-cerip-forest/5 overflow-hidden">
          <h2 className="text-sm font-semibold text-cerip-forest px-4 py-3 border-b border-cerip-forest/10">Résumé</h2>
          <div className="p-4 grid gap-3 sm:grid-cols-2">
            <p><span className="text-cerip-forest/70 text-xs">Promotion(s)</span><br />{promotions.join(', ') || '—'}</p>
            <p><span className="text-cerip-forest/70 text-xs">Parcours</span><br />{incube.current_parcours ?? '—'}</p>
            <p><span className="text-cerip-forest/70 text-xs">Scores P1 / P2</span><br />
              {incube.p1_score != null ? `${incube.p1_score} %` : '—'} / {incube.p2_score != null ? `${incube.p2_score} %` : '—'}
            </p>
            <p><span className="text-cerip-forest/70 text-xs">Statut</span><br />
              <span className="font-medium">{STATUS_LABELS[incube.global_status] ?? incube.global_status}</span>
            </p>
          </div>
          {canValidate && (
            <div className="px-4 pb-4">
              <button
                type="button"
                disabled={validating}
                onClick={handleAutoriserCertification}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-cerip-lime text-white hover:bg-cerip-lime-dark disabled:opacity-50 transition"
              >
                {validating ? 'En cours…' : 'Autoriser certification (Clé 1)'}
              </button>
            </div>
          )}
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-cerip-forest/5 overflow-hidden">
          <h2 className="text-sm font-semibold text-cerip-forest px-4 py-3 border-b border-cerip-forest/10">Progression des modules</h2>
          {modules.length === 0 ? (
            <p className="p-4 text-sm text-cerip-forest/70">Aucun module pour ce parcours.</p>
          ) : (
            <ul className="divide-y divide-cerip-forest/5">
              {modules.map((m) => {
                const prog = progress[m.id];
                return (
                  <li key={m.id} className="px-4 py-3 flex items-center justify-between gap-2">
                    <span className="font-medium text-cerip-forest">{m.title}</span>
                    <span className="text-xs text-cerip-forest/80">
                      {prog?.completed_at
                        ? (m.type === 'quiz' && prog.score_pct != null ? `Complété · ${prog.score_pct} %` : 'Complété')
                        : 'Non complété'}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-cerip-forest/5 overflow-hidden">
          <h2 className="text-sm font-semibold text-cerip-forest px-4 py-3 border-b border-cerip-forest/10">Demandes de coaching</h2>
          {requests.length === 0 ? (
            <p className="p-4 text-sm text-cerip-forest/70">Aucune demande.</p>
          ) : (
            <ul className="divide-y divide-cerip-forest/5">
              {requests.map((r) => (
                <li key={r.id} className="px-4 py-3">
                  <p className="text-xs text-cerip-forest/70">
                    {new Date(r.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    {' · '}
                    <span className={r.status === 'PENDING' ? 'text-cerip-magenta font-medium' : 'text-cerip-forest/80'}>
                      {r.status === 'PENDING' ? 'En attente' : 'Traité'}
                    </span>
                  </p>
                  {r.message && <p className="text-sm text-cerip-forest mt-1">{r.message}</p>}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

export default CoachIncubeDetailPage;
