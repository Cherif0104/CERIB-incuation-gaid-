import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import MetricCard from '../components/MetricCard';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function CertificateurDashboard() {
  const { profile } = useOutletContext() || {};
  const [sessions, setSessions] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', start_at: '', end_at: '' });
  const [togglingId, setTogglingId] = useState(null);
  const [expandedSessionId, setExpandedSessionId] = useState(null);

  const orgId = profile?.organisation_id;

  const fetchSessions = async () => {
    if (!orgId) return;
    const { data, error: e } = await supabase
      .from('certification_sessions')
      .select('*')
      .eq('organisation_id', orgId)
      .order('start_at', { ascending: false });
    if (!e) setSessions(data || []);
  };

  const fetchCandidates = async () => {
    if (!orgId) return;
    const { data, error: e } = await supabase
      .from('certification_candidates')
      .select('*, incubes(full_name, email)')
      .eq('organisation_id', orgId)
      .not('coach_validation_at', 'is', null)
      .order('created_at', { ascending: false });
    if (!e) setCandidates(data || []);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      await fetchSessions();
      await fetchCandidates();
      setLoading(false);
    };
    if (orgId) load();
  }, [orgId]);

  const handleCreateSession = async (e) => {
    e.preventDefault();
    if (!orgId || !form.start_at || !form.end_at) return;
    setCreating(true);
    setError(null);
    const { error: insErr } = await supabase.from('certification_sessions').insert({
      organisation_id: orgId,
      name: form.name.trim() || null,
      start_at: new Date(form.start_at).toISOString(),
      end_at: new Date(form.end_at).toISOString(),
      status: 'SCHEDULED',
    });
    setCreating(false);
    if (insErr) setError(insErr.message);
    else {
      setForm({ name: '', start_at: '', end_at: '' });
      await fetchSessions();
    }
  };

  const handleToggleSession = async (session) => {
    const nextStatus = session.status === 'OPEN' ? 'CLOSED' : 'OPEN';
    setTogglingId(session.id);
    setError(null);
    const { error: upErr } = await supabase
      .from('certification_sessions')
      .update({ status: nextStatus })
      .eq('id', session.id);
    setTogglingId(null);
    if (upErr) setError(upErr.message);
    else await fetchSessions();
  };

  const candidatesPending = candidates.filter((c) => c.exam_status === 'PENDING' && !c.exam_result).length;
  const certifiedCount = candidates.filter((c) => c.exam_result === 'CERTIFIED').length;
  const failedCount = candidates.filter((c) => c.exam_result === 'FAILED').length;

  if (!orgId) {
    return (
      <div className="flex-1 flex flex-col">
        <header className="px-6 py-4 border-b border-cerip-forest/10 bg-white">
          <h1 className="text-lg font-semibold text-cerip-forest">Certificateur</h1>
        </header>
        <main className="flex-1 p-6">
          <p className="text-cerip-forest/70">Aucune organisation assignée.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <header className="px-6 py-4 border-b border-cerip-forest/10 bg-white">
        <h1 className="text-lg font-semibold text-cerip-forest">Certificateur – Ouverture de sessions</h1>
        <p className="text-xs text-cerip-forest/70 mt-0.5">
          Planification des fenêtres d’examen (Clé 2) et ouverture pour que les incubés puissent lancer le QCM.
        </p>
      </header>
      <main className="flex-1 p-6 space-y-6">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm px-4 py-3">{error}</div>
        )}

        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Sessions" value={sessions.length} subText="Fenêtres créées" animationDelay={0} />
          <MetricCard label="En attente d'examen" value={candidatesPending} subText="Clé 1 validée" animationDelay={60} />
          <MetricCard label="Certifiés" value={certifiedCount} subText="Réussite" animationDelay={120} />
          <MetricCard label="Non certifiés" value={failedCount} subText="Échec" animationDelay={180} />
        </div>

        <section className="bg-white rounded-xl shadow-sm border border-cerip-forest/5 overflow-hidden">
          <h2 className="text-sm font-semibold text-cerip-forest px-4 py-3 border-b border-cerip-forest/10">
            Créer une fenêtre d’examen
          </h2>
          <form onSubmit={handleCreateSession} className="p-4 space-y-4">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-cerip-forest/80">Nom (optionnel)</span>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Ex. Session juin 2025"
                className="rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm text-cerip-forest focus:ring-2 focus:ring-cerip-lime focus:border-cerip-forest/30"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-cerip-forest/80">Ouverture (début)</span>
                <input
                  type="datetime-local"
                  value={form.start_at}
                  onChange={(e) => setForm((f) => ({ ...f, start_at: e.target.value }))}
                  className="rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm text-cerip-forest focus:ring-2 focus:ring-cerip-lime focus:border-cerip-forest/30"
                  required
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-cerip-forest/80">Fermeture (fin)</span>
                <input
                  type="datetime-local"
                  value={form.end_at}
                  onChange={(e) => setForm((f) => ({ ...f, end_at: e.target.value }))}
                  className="rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm text-cerip-forest focus:ring-2 focus:ring-cerip-lime focus:border-cerip-forest/30"
                  required
                />
              </label>
            </div>
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-cerip-lime text-white hover:bg-cerip-lime-dark disabled:opacity-50 transition"
            >
              {creating ? 'Création…' : 'Créer la fenêtre'}
            </button>
          </form>
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-cerip-forest/5 overflow-hidden">
          <h2 className="text-sm font-semibold text-cerip-forest px-4 py-3 border-b border-cerip-forest/10">
            Fenêtres de certification
          </h2>
          {loading ? (
            <div className="p-6 text-center text-cerip-forest/70 text-sm">Chargement…</div>
          ) : sessions.length === 0 ? (
            <div className="p-6 text-center text-cerip-forest/70 text-sm">Aucune session. Créez-en une ci-dessus.</div>
          ) : (
            <ul className="divide-y divide-cerip-forest/5">
              {sessions.map((s) => {
                const now = new Date();
                const start = new Date(s.start_at);
                const end = new Date(s.end_at);
                const isOpen = s.status === 'OPEN';
                const inWindow = now >= start && now <= end;
                const sessionCandidates = candidates.filter((c) => c.session_id === s.id);
                const expanded = expandedSessionId === s.id;
                return (
                  <li key={s.id} className="hover:bg-cerip-forest-light/30">
                    <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-cerip-forest">{s.name || 'Sans nom'}</p>
                        <p className="text-xs text-cerip-forest/70">
                          {formatDate(s.start_at)} → {formatDate(s.end_at)}
                          {' · '}
                          <span className={s.status === 'OPEN' ? 'text-cerip-lime font-medium' : 'text-cerip-forest/70'}>
                            {s.status === 'OPEN' ? 'Ouvert' : s.status === 'CLOSED' ? 'Fermé' : 'Programmée'}
                          </span>
                          {inWindow && s.status !== 'OPEN' && (
                            <span className="ml-1 text-cerip-magenta text-xs">(dans la plage horaire)</span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setExpandedSessionId(expanded ? null : s.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-cerip-forest/10 text-cerip-forest hover:bg-cerip-forest/20"
                        >
                          {expanded ? 'Masquer' : 'Voir candidats'} ({sessionCandidates.length})
                        </button>
                        <button
                          type="button"
                          disabled={togglingId === s.id}
                          onClick={() => handleToggleSession(s)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                            isOpen
                              ? 'bg-cerip-magenta/10 text-cerip-magenta hover:bg-cerip-magenta/20'
                              : 'bg-cerip-lime text-white hover:bg-cerip-lime-dark'
                          } disabled:opacity-50`}
                        >
                          {togglingId === s.id ? '…' : isOpen ? 'Fermer la fenêtre' : 'Ouvrir la fenêtre (Clé 2)'}
                        </button>
                      </div>
                    </div>
                    {expanded && (
                      <div className="px-4 pb-3 border-t border-cerip-forest/5">
                        {sessionCandidates.length === 0 ? (
                          <p className="text-xs text-cerip-forest/70 py-2">Aucun candidat lié à cette session.</p>
                        ) : (
                          <table className="w-full text-sm mt-2">
                            <thead>
                              <tr className="text-left text-cerip-forest/70">
                                <th className="py-1 pr-2 font-medium">Incubé</th>
                                <th className="py-1 pr-2 font-medium">Examen</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sessionCandidates.map((c) => (
                                <tr key={c.id} className="border-t border-cerip-forest/5">
                                  <td className="py-2">
                                    <p className="font-medium text-cerip-forest">{c.incubes?.full_name ?? c.incube_id}</p>
                                    <p className="text-xs text-cerip-forest/70">{c.incubes?.email}</p>
                                  </td>
                                  <td className="py-2 text-cerip-forest/80">{c.exam_status} {c.exam_result ? `· ${c.exam_result}` : ''}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-cerip-forest/5 overflow-hidden">
          <h2 className="text-sm font-semibold text-cerip-forest px-4 py-3 border-b border-cerip-forest/10">
            Candidats validés par les coachs (Clé 1)
          </h2>
          {loading ? (
            <div className="p-6 text-center text-cerip-forest/70 text-sm">Chargement…</div>
          ) : candidates.length === 0 ? (
            <div className="p-6 text-center text-cerip-forest/70 text-sm">Aucun candidat pour le moment.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-cerip-forest/10 bg-cerip-forest-light/50">
                    <th className="text-left px-4 py-3 font-medium text-cerip-forest">Incubé</th>
                    <th className="text-left px-4 py-3 font-medium text-cerip-forest">Validé par le coach le</th>
                    <th className="text-left px-4 py-3 font-medium text-cerip-forest">Examen</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map((c) => (
                    <tr key={c.id} className="border-b border-cerip-forest/5 hover:bg-cerip-forest-light/30">
                      <td className="px-4 py-3">
                        <p className="font-medium text-cerip-forest">{c.incubes?.full_name ?? c.incube_id}</p>
                        <p className="text-xs text-cerip-forest/70">{c.incubes?.email}</p>
                      </td>
                      <td className="px-4 py-3 text-cerip-forest/80">{formatDate(c.coach_validation_at)}</td>
                      <td className="px-4 py-3 text-cerip-forest/80">{c.exam_status} {c.exam_result ? `· ${c.exam_result}` : ''}</td>
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

export default CertificateurDashboard;
