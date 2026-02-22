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
  const [activeTab, setActiveTab] = useState('inspection');
  const [inspectionComment, setInspectionComment] = useState('');
  const [inspectionMois, setInspectionMois] = useState(1);
  const [paramModalOpen, setParamModalOpen] = useState(false);
  const [paramForm, setParamForm] = useState({ full_name: '', email: '', temps_h: 4, sessions: 2, max_sos: 1, max_rdv: 1 });
  const [contactMessage, setContactMessage] = useState('');
  const [rdvObjectif, setRdvObjectif] = useState('');
  const [rdvTravailPrep, setRdvTravailPrep] = useState('');
  const [rdvDate, setRdvDate] = useState('');
  const [rdvTime, setRdvTime] = useState('');
  const [rdvPlatform, setRdvPlatform] = useState('Google Meet');
  const [rdvLink, setRdvLink] = useState('');
  const [messagesList, setMessagesList] = useState([]);
  const [savingParam, setSavingParam] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [sendingRdv, setSendingRdv] = useState(false);
  const [moisValidated, setMoisValidated] = useState(new Set());

  useEffect(() => {
    if (!incubeId) {
      setLoading(false);
      return;
    }
    if (!profile?.id) {
      setError('Session invalide. Reconnectez-vous.');
      setLoading(false);
      return;
    }
    const load = async () => {
      setLoading(true);
      setError(null);
      setForbidden(false);
      try {
        const { data: assignations } = await supabase
          .from('assignations')
          .select('id, promotion_id, promotions(name)')
          .eq('coach_id', profile.id)
          .eq('incube_id', incubeId);
        if (!assignations?.length) {
          setForbidden(true);
          setIncube(null);
          return;
        }
        const { data: incubeData, error: incErr } = await supabase
          .from('incubes')
          .select('id, full_name, email, current_parcours, p1_score, p2_score, global_status, organisation_id, temps_h, sessions, max_sos, max_rdv')
          .eq('id', incubeId)
          .single();
        if (incErr || !incubeData) {
          setError(incErr?.message || 'Incubé introuvable.');
          setIncube(null);
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
            .select('id, message, status, created_at, responded_at, request_type, objectif, travail_preparatoire, scheduled_at, platform, meeting_link')
            .eq('incube_id', incubeId)
            .eq('coach_id', profile.id)
            .order('created_at', { ascending: false }),
        ]);
        setModules(modsRes.data ?? []);
        const byModule = {};
        (progRes.data ?? []).forEach((p) => { byModule[p.module_id] = p; });
        setProgress(byModule);
        setRequests(reqRes.data ?? []);
        setParamForm({
          full_name: incubeData.full_name ?? '',
          email: incubeData.email ?? '',
          temps_h: incubeData.temps_h ?? 4,
          sessions: incubeData.sessions ?? 2,
          max_sos: incubeData.max_sos ?? 1,
          max_rdv: incubeData.max_rdv ?? 1,
        });
        const { data: validations } = await supabase.from('incube_mois_validation').select('mois_num').eq('incube_id', incubeId);
        setMoisValidated(new Set((validations ?? []).map((v) => v.mois_num)));
        const { data: msgs } = await supabase.from('coach_incube_messages').select('id, body, is_urgence, from_incube, created_at').eq('incube_id', incubeId).eq('coach_id', profile.id).order('created_at', { ascending: true });
        setMessagesList(msgs ?? []);
      } catch (err) {
        console.error('CoachIncubeDetailPage load:', err);
        setError(err?.message || 'Erreur lors du chargement.');
        setIncube(null);
      } finally {
        setLoading(false);
      }
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

  const handleValidateMois = async () => {
    if (!incubeId || !profile?.id) return;
    setError(null);
    const { error: err } = await supabase.from('incube_mois_validation').upsert(
      { incube_id: incubeId, mois_num: inspectionMois, coach_id: profile.id, comment: inspectionComment || null },
      { onConflict: 'incube_id,mois_num' }
    );
    if (err) setError(err.message);
    else {
      setMoisValidated((s) => new Set([...s, inspectionMois]));
      setInspectionComment('');
    }
  };

  const handleRejectMois = async () => {
    setError(null);
    const pending = requests.find((r) => r.status === 'PENDING');
    if (pending && inspectionComment) {
      await supabase.from('coaching_requests').update({ message: inspectionComment }).eq('id', pending.id);
    }
    setInspectionComment('');
  };

  const handleSaveParametres = async () => {
    if (!incubeId) return;
    setSavingParam(true);
    setError(null);
    const { error: err } = await supabase.from('incubes').update({
      full_name: paramForm.full_name,
      email: paramForm.email,
      temps_h: paramForm.temps_h,
      sessions: paramForm.sessions,
      max_sos: paramForm.max_sos,
      max_rdv: paramForm.max_rdv,
    }).eq('id', incubeId);
    setSavingParam(false);
    if (err) setError(err.message);
    else {
      setIncube((prev) => (prev ? { ...prev, ...paramForm } : null));
      setParamModalOpen(false);
    }
  };

  const handleSendMessage = async () => {
    if (!incubeId || !profile?.id || !contactMessage.trim()) return;
    setSendingMessage(true);
    setError(null);
    const { error: err } = await supabase.from('coach_incube_messages').insert({
      incube_id: incubeId,
      coach_id: profile.id,
      body: contactMessage.trim(),
      from_incube: false,
    });
    setSendingMessage(false);
    if (err) setError(err.message);
    else {
      setContactMessage('');
      const { data } = await supabase.from('coach_incube_messages').select('id, body, from_incube, created_at').eq('incube_id', incubeId).eq('coach_id', profile.id).order('created_at', { ascending: true });
      setMessagesList(data ?? []);
    }
  };

  const handleSendRdv = async () => {
    if (!incubeId || !profile?.id || !incube?.organisation_id) return;
    setSendingRdv(true);
    setError(null);
    const scheduledAt = rdvDate && rdvTime ? new Date(`${rdvDate}T${rdvTime}`).toISOString() : null;
    const { error: err } = await supabase.from('coaching_requests').insert({
      incube_id: incubeId,
      coach_id: profile.id,
      organisation_id: incube.organisation_id,
      status: 'PENDING',
      request_type: 'RDV',
      objectif: rdvObjectif || null,
      travail_preparatoire: rdvTravailPrep || null,
      scheduled_at: scheduledAt,
      platform: rdvPlatform || null,
      meeting_link: rdvLink || null,
    });
    setSendingRdv(false);
    if (err) setError(err.message);
    else {
      setRdvObjectif('');
      setRdvTravailPrep('');
      setRdvDate('');
      setRdvTime('');
      setRdvLink('');
      const { data } = await supabase.from('coaching_requests').select('id, message, status, created_at, request_type, objectif, travail_preparatoire, scheduled_at, platform, meeting_link').eq('incube_id', incubeId).eq('coach_id', profile.id).order('created_at', { ascending: false });
      setRequests(data ?? []);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col p-6">
        <p className="text-cerip-forest/70 text-sm">Chargement…</p>
        <Link to="/coach" className="mt-2 text-sm text-cerip-forest/60 hover:underline">Retour</Link>
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
        <p className="text-cerip-forest/80 font-medium">Fiche incubé</p>
        {error && <p className="mt-2 text-red-600 text-sm">{error}</p>}
        <p className="mt-2 text-cerip-forest/70 text-sm">Incubé introuvable ou accès refusé.</p>
        <Link to="/coach" className="mt-4 inline-block text-sm font-medium text-cerip-lime hover:underline">← Retour au tableau de bord</Link>
      </div>
    );
  }

  const tabs = [
    { id: 'inspection', label: 'INSPECTION & VALIDATION' },
    { id: 'parametres', label: 'PARAMÈTRES & PROFIL' },
    { id: 'livrables', label: 'LIVRABLES' },
    { id: 'historique', label: 'HISTORIQUE JDB' },
    { id: 'contacter', label: 'CONTACTER' },
  ];

  return (
    <div className="flex-1 flex flex-col">
      <header className="px-6 py-4 border-b border-cerip-forest/10 bg-white">
        <Link to="/coach" className="text-xs text-cerip-forest/70 hover:text-cerip-forest mb-1 inline-block">← Tableau de bord</Link>
        <p className="text-xs text-cerip-forest/70 mb-1">{incube.email}</p>
        <div className="flex flex-wrap gap-2 mt-2">
          {tabs.map((t) => (
            <button key={t.id} type="button" onClick={() => setActiveTab(t.id)} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${activeTab === t.id ? 'bg-cerip-lime text-cerip-forest' : 'bg-cerip-forest/10 text-cerip-forest/80 hover:bg-cerip-forest/20'}`}>{t.label}</button>
          ))}
        </div>
      </header>
      <main className="flex-1 p-6 space-y-6">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm px-4 py-3">{error}</div>
        )}

        {activeTab === 'inspection' && (
          <section className="bg-white rounded-xl shadow-sm border border-cerip-forest/5 overflow-hidden">
            <h2 className="text-sm font-semibold text-cerip-forest px-4 py-3 border-b border-cerip-forest/10">INSPECTION & VALIDATION</h2>
            <div className="p-4">
              <label className="block text-xs font-medium text-cerip-forest/70 mb-2">Mois à valider</label>
              <select value={inspectionMois} onChange={(e) => setInspectionMois(Number(e.target.value))} className="mb-4 px-3 py-2 rounded-lg border border-cerip-forest/20 text-sm">
                {[1, 2, 3, 4].map((n) => (
                  <option key={n} value={n}>Mois {n}</option>
                ))}
              </select>
              <label className="block text-xs font-medium text-cerip-forest/70 mb-2">Commentaire Pédagogique…</label>
              <textarea value={inspectionComment} onChange={(e) => setInspectionComment(e.target.value)} placeholder="Commentaire Pédagogique…" className="w-full h-32 px-3 py-2 rounded-lg border border-cerip-forest/20 text-sm resize-none mb-4" />
              <div className="flex gap-2">
                <button type="button" onClick={handleRejectMois} className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-500 text-white hover:bg-red-600">REJETER & DEMANDER CORRECTION</button>
                <button type="button" onClick={handleValidateMois} className="px-4 py-2 rounded-lg text-sm font-semibold bg-cerip-lime text-cerip-forest hover:bg-cerip-lime-dark flex items-center gap-2">VALIDER LE MOIS</button>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'parametres' && (
          <section className="bg-white rounded-xl shadow-sm border border-cerip-forest/5 overflow-hidden">
            <h2 className="text-sm font-semibold text-cerip-forest px-4 py-3 border-b border-cerip-forest/10">PARAMÈTRES & PROFIL</h2>
            <div className="p-4">
              <p className="text-sm text-cerip-forest/80 mb-4">Résumé de l&apos;incubé et paramètres.</p>
              <div className="grid gap-3 sm:grid-cols-2 mb-4">
                <p><span className="text-cerip-forest/70 text-xs">Nom</span><br />{incube.full_name}</p>
                <p><span className="text-cerip-forest/70 text-xs">Email</span><br />{incube.email}</p>
                <p><span className="text-cerip-forest/70 text-xs">Temps (h)</span><br />{incube.temps_h ?? '—'}</p>
                <p><span className="text-cerip-forest/70 text-xs">Sessions / Max SOS / Max RDV</span><br />{incube.sessions ?? '—'} / {incube.max_sos ?? '—'} / {incube.max_rdv ?? '—'}</p>
              </div>
              <button type="button" onClick={() => setParamModalOpen(true)} className="px-4 py-2 rounded-lg text-sm font-medium bg-cerip-lime text-cerip-forest hover:bg-cerip-lime-dark">Modifier les paramètres</button>
            </div>
          </section>
        )}

        {activeTab === 'livrables' && (
          <section className="bg-white rounded-xl shadow-sm border border-cerip-forest/5 overflow-hidden">
            <h2 className="text-sm font-semibold text-cerip-forest px-4 py-3 border-b border-cerip-forest/10">LIVRABLES</h2>
            <div className="p-4">
              {modules.length === 0 ? (
                <p className="text-sm text-cerip-forest/70">Aucun module.</p>
              ) : (
                <ul className="divide-y divide-cerip-forest/5">
                  {modules.map((m) => {
                    const prog = progress[m.id];
                    return (
                      <li key={m.id} className="py-3 flex items-center justify-between gap-2">
                        <span className="font-medium text-cerip-forest">{m.title}</span>
                        <span className="text-xs text-cerip-forest/80">{prog?.completed_at ? (prog.score_pct != null ? `${prog.score_pct} %` : 'Complété') : 'Non complété'}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>
        )}

        {activeTab === 'historique' && (
          <section className="bg-white rounded-xl shadow-sm border border-cerip-forest/5 overflow-hidden">
            <h2 className="text-sm font-semibold text-cerip-forest px-4 py-3 border-b border-cerip-forest/10">HISTORIQUE JDB</h2>
            <div className="p-4">
              <p className="text-xs text-cerip-forest/70 mb-2">Mois validés : {[...moisValidated].sort((a, b) => a - b).join(', ') || '—'}</p>
              <ul className="divide-y divide-cerip-forest/5">
                {Object.entries(progress).filter(([, p]) => p?.completed_at).map(([moduleId, p]) => {
                  const m = modules.find((x) => x.id === moduleId);
                  return (
                    <li key={moduleId} className="py-2 text-sm text-cerip-forest/90">
                      {m?.title ?? 'Module'} — {p.score_pct != null ? `${p.score_pct} %` : 'Complété'} · {new Date(p.completed_at).toLocaleDateString('fr-FR')}
                    </li>
                  );
                })}
              </ul>
              {moisValidated.size === 0 && Object.keys(progress).length === 0 && <p className="text-sm text-cerip-forest/70">Aucune activité.</p>}
            </div>
          </section>
        )}

        {activeTab === 'contacter' && (
          <section className="bg-white rounded-xl shadow-sm border border-cerip-forest/5 overflow-hidden p-4 space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-cerip-forest mb-2">ENVOYER MESSAGE</h3>
              <textarea value={contactMessage} onChange={(e) => setContactMessage(e.target.value)} placeholder="Message rapide…" className="w-full h-24 px-3 py-2 rounded-lg border border-cerip-forest/20 text-sm resize-none mb-2" />
              <button type="button" disabled={sendingMessage || !contactMessage.trim()} onClick={handleSendMessage} className="px-4 py-2 rounded-lg text-sm font-semibold bg-cerip-lime text-cerip-forest hover:bg-cerip-lime-dark disabled:opacity-50">ENVOYER MESSAGE</button>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-cerip-forest mb-2">CONVOQUER UN RDV</h3>
              <input type="text" value={rdvObjectif} onChange={(e) => setRdvObjectif(e.target.value)} placeholder="Objectif du RDV…" className="w-full px-3 py-2 rounded-lg border border-cerip-forest/20 text-sm mb-2" />
              <input type="text" value={rdvTravailPrep} onChange={(e) => setRdvTravailPrep(e.target.value)} placeholder="Travail préparatoire…" className="w-full px-3 py-2 rounded-lg border border-cerip-forest/20 text-sm mb-2" />
              <div className="flex gap-2 mb-2">
                <input type="date" value={rdvDate} onChange={(e) => setRdvDate(e.target.value)} className="px-3 py-2 rounded-lg border border-cerip-forest/20 text-sm" />
                <input type="time" value={rdvTime} onChange={(e) => setRdvTime(e.target.value)} className="px-3 py-2 rounded-lg border border-cerip-forest/20 text-sm" />
              </div>
              <select value={rdvPlatform} onChange={(e) => setRdvPlatform(e.target.value)} className="mb-2 px-3 py-2 rounded-lg border border-cerip-forest/20 text-sm">
                <option value="Google Meet">Google Meet</option>
                <option value="Zoom">Zoom</option>
                <option value="WhatsApp">WhatsApp</option>
              </select>
              <input type="url" value={rdvLink} onChange={(e) => setRdvLink(e.target.value)} placeholder="Lien…" className="w-full px-3 py-2 rounded-lg border border-cerip-forest/20 text-sm mb-2" />
              <button type="button" disabled={sendingRdv} onClick={handleSendRdv} className="px-4 py-2 rounded-lg text-sm font-semibold bg-cerip-magenta text-white hover:opacity-90 disabled:opacity-50">ENVOYER CONVOCATION</button>
            </div>
          </section>
        )}

        {activeTab === 'inspection' && (
          <>
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
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-cerip-lime text-cerip-forest hover:bg-cerip-lime-dark disabled:opacity-50 transition"
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
                          {prog?.completed_at ? (m.type === 'quiz' && prog.score_pct != null ? `Complété · ${prog.score_pct} %` : 'Complété') : 'Non complété'}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
            <section className="bg-white rounded-xl shadow-sm border border-cerip-forest/5 overflow-hidden">
              <h2 className="text-sm font-semibold text-cerip-forest px-4 py-3 border-b border-cerip-forest/10">Demandes de coaching et RDV</h2>
              {requests.length === 0 ? (
                <p className="p-4 text-sm text-cerip-forest/70">Aucune demande.</p>
              ) : (
                <ul className="divide-y divide-cerip-forest/5">
                  {requests.map((r) => (
                    <li key={r.id} className="px-4 py-3">
                      <p className="text-xs text-cerip-forest/70">
                        {new Date(r.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        {' · '}
                        <span className={r.status === 'PENDING' ? 'text-cerip-magenta font-medium' : 'text-cerip-forest/80'}>{r.status === 'PENDING' ? 'En attente' : 'Traité'}</span>
                        {r.request_type && r.request_type !== 'COACHING' && <span> · {r.request_type}</span>}
                      </p>
                      {r.request_type === 'RDV' && (r.objectif || r.scheduled_at || r.meeting_link) && (
                        <div className="mt-2 text-sm text-cerip-forest/90 space-y-0.5">
                          {r.objectif && <p><span className="text-cerip-forest/70">Objectif :</span> {r.objectif}</p>}
                          {r.travail_preparatoire && <p><span className="text-cerip-forest/70">Travail préparatoire :</span> {r.travail_preparatoire}</p>}
                          {r.scheduled_at && <p><span className="text-cerip-forest/70">Date :</span> {new Date(r.scheduled_at).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })}</p>}
                          {r.platform && <p><span className="text-cerip-forest/70">Plateforme :</span> {r.platform}</p>}
                          {r.meeting_link && <p><a href={r.meeting_link} target="_blank" rel="noopener noreferrer" className="text-cerip-lime hover:underline">Lien de réunion</a></p>}
                        </div>
                      )}
                      {r.message && <p className="text-sm text-cerip-forest mt-1">{r.message}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </main>

      {paramModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" aria-modal="true" role="dialog">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-cerip-forest/10">
            <h3 className="text-lg font-bold text-cerip-forest mb-4">PARAMÈTRES ÉTUDIANT</h3>
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs font-medium text-cerip-forest/70 mb-1">Nom</label>
                <input type="text" value={paramForm.full_name} onChange={(e) => setParamForm((f) => ({ ...f, full_name: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-cerip-forest/20 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-cerip-forest/70 mb-1">Email</label>
                <input type="email" value={paramForm.email} onChange={(e) => setParamForm((f) => ({ ...f, email: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-cerip-forest/20 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-cerip-forest/70 mb-1">Temps (h)</label>
                  <input type="number" min={0} value={paramForm.temps_h} onChange={(e) => setParamForm((f) => ({ ...f, temps_h: Number(e.target.value) || 0 }))} className="w-full px-3 py-2 rounded-lg border border-cerip-forest/20 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-cerip-forest/70 mb-1">Sessions</label>
                  <input type="number" min={0} value={paramForm.sessions} onChange={(e) => setParamForm((f) => ({ ...f, sessions: Number(e.target.value) || 0 }))} className="w-full px-3 py-2 rounded-lg border border-cerip-forest/20 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-cerip-forest/70 mb-1">Max SOS</label>
                  <input type="number" min={0} value={paramForm.max_sos} onChange={(e) => setParamForm((f) => ({ ...f, max_sos: Number(e.target.value) || 0 }))} className="w-full px-3 py-2 rounded-lg border border-cerip-forest/20 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-cerip-forest/70 mb-1">Max RDV</label>
                  <input type="number" min={0} value={paramForm.max_rdv} onChange={(e) => setParamForm((f) => ({ ...f, max_rdv: Number(e.target.value) || 0 }))} className="w-full px-3 py-2 rounded-lg border border-cerip-forest/20 text-sm" />
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setParamModalOpen(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-cerip-magenta border border-cerip-magenta hover:bg-cerip-magenta/10">Annuler</button>
              <button type="button" disabled={savingParam} onClick={handleSaveParametres} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-cerip-lime text-cerip-forest hover:bg-cerip-lime-dark disabled:opacity-70">SAUVEGARDER</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CoachIncubeDetailPage;
