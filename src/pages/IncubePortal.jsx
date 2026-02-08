import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const STATUS_LABELS = {
  P1_EN_COURS: 'P1 en cours',
  P2_EN_COURS: 'P2 en cours',
  READY_FOR_REVIEW: 'En attente de validation coach',
  COACH_VALIDATED: 'Validé pour certification',
  SESSION_SCHEDULED: 'Session programmée',
  EXAM_IN_PROGRESS: 'Examen en cours',
  CERTIFIED: 'Certifié',
  FAILED: 'Non certifié',
};

/** Note minimale au quiz pour débloquer l'étape suivante (en %) */
const REQUIRED_QUIZ_SCORE_PCT = 70;

/** Niveau gamifié : Lionceau → En chemin → Gaindé */
function getNiveauBadge(profile) {
  if (profile?.global_status === 'CERTIFIED') return { label: 'Gaindé', color: 'bg-cerip-lime text-white' };
  const p1 = profile?.p1_score != null ? Number(profile.p1_score) : 0;
  if (p1 >= 70 || profile?.current_parcours === 'P2') return { label: 'En chemin', color: 'bg-cerip-forest-mid text-white' };
  return { label: 'Lionceau', color: 'bg-cerip-magenta/15 text-cerip-magenta-dark' };
}

/** Retourne une URL embed pour YouTube/Vimeo, ou null si non reconnu */
function getEmbedVideoUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const u = url.trim();
  const ytMatch = u.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  const vimeoMatch = u.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  return null;
}

function IncubePortal({ profile, onRefreshProfile, onLogout }) {
  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cerip-forest-light p-4">
        <p className="text-cerip-forest/80">Chargement…</p>
      </div>
    );
  }
  return <IncubePortalContent profile={profile} onRefreshProfile={onRefreshProfile} onLogout={onLogout} />;
}

function IncubePortalContent({ profile, onRefreshProfile, onLogout }) {
  const navigate = useNavigate();
  const [coachId, setCoachId] = useState(null);
  const [coachName, setCoachName] = useState(null);
  const [requestSent, setRequestSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [requestError, setRequestError] = useState(null);
  const [examEligible, setExamEligible] = useState({ canLaunch: false, candidateId: null, sessionEnd: null, sessionId: null });
  const [coachingRequestsHistory, setCoachingRequestsHistory] = useState([]);
  const [coachingHistoryOpen, setCoachingHistoryOpen] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [modules, setModules] = useState([]);
  const [progress, setProgress] = useState({});
  const [modulesLoading, setModulesLoading] = useState(false);
  const [quizModule, setQuizModule] = useState(null);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitting, setQuizSubmitting] = useState(false);
  const [quizResult, setQuizResult] = useState(null);
  const [contentModule, setContentModule] = useState(null);
  const parcoursSectionRef = useRef(null);

  useEffect(() => {
    if (!profile?.id) return;
    const fetchCoach = async () => {
      const { data } = await supabase
        .from('assignations')
        .select('coach_id')
        .eq('incube_id', profile.id)
        .limit(1);
      const cid = data?.[0]?.coach_id ?? null;
      setCoachId(cid);
      if (cid) {
        const { data: staff } = await supabase
          .from('staff_users')
          .select('full_name')
          .eq('id', cid)
          .single();
        setCoachName(staff?.full_name ?? null);
      } else {
        setCoachName(null);
      }
    };
    fetchCoach();
  }, [profile?.id]);

  useEffect(() => {
    if (!profile?.id) return;
    const fetchCoachingHistory = async () => {
      const { data } = await supabase
        .from('coaching_requests')
        .select('id, message, status, created_at, responded_at')
        .eq('incube_id', profile.id)
        .order('created_at', { ascending: false });
      setCoachingRequestsHistory(data ?? []);
    };
    fetchCoachingHistory();
  }, [profile?.id]);

  useEffect(() => {
    if (!profile?.id || !profile?.organisation_id || !profile?.current_parcours) return;
    setModulesLoading(true);
    const load = async () => {
      const { data: mods } = await supabase
        .from('learning_modules')
        .select('id, title, description, sort_order, type, payload, parcours_phase')
        .or(`organisation_id.eq.${profile.organisation_id},organisation_id.is.null`)
        .or(`parcours_phase.eq.${profile.current_parcours},parcours_phase.eq.P3`)
        .order('sort_order');
      setModules(mods ?? []);
      const { data: prog } = await supabase
        .from('incube_module_progress')
        .select('module_id, completed_at, score_pct')
        .eq('incube_id', profile.id);
      const byModule = {};
      (prog ?? []).forEach((p) => { byModule[p.module_id] = p; });
      setProgress(byModule);
    };
    load().finally(() => setModulesLoading(false));
  }, [profile?.id, profile?.organisation_id, profile?.current_parcours]);

  useEffect(() => {
    if (!profile?.id || !profile?.organisation_id) return;
    const checkExam = async () => {
      const now = new Date().toISOString();
      const { data: sessions } = await supabase
        .from('certification_sessions')
        .select('id, end_at')
        .eq('organisation_id', profile.organisation_id)
        .eq('status', 'OPEN')
        .lte('start_at', now)
        .gte('end_at', now);
      const openSession = sessions?.[0];
      if (!openSession) {
        setExamEligible({ canLaunch: false, candidateId: null, sessionEnd: null, sessionId: null });
        return;
      }
      const { data: candidates } = await supabase
        .from('certification_candidates')
        .select('id, exam_status, exam_result')
        .eq('incube_id', profile.id)
        .not('coach_validation_at', 'is', null);
      const candidate = candidates?.[0];
      const canLaunch = candidate && candidate.exam_status === 'PENDING' && !candidate.exam_result;
      setExamEligible(
        canLaunch
          ? { canLaunch: true, candidateId: candidate.id, sessionEnd: openSession.end_at, sessionId: openSession.id }
          : { canLaunch: false, candidateId: null, sessionEnd: null, sessionId: null }
      );
    };
    checkExam();
  }, [profile?.id, profile?.organisation_id]);

  const handleLancerExamen = async () => {
    if (!examEligible.candidateId) return;
    setLaunching(true);
    setRequestError(null);
    const updatePayload = {
      exam_status: 'IN_PROGRESS',
      exam_started_at: new Date().toISOString(),
      ...(examEligible.sessionId && { session_id: examEligible.sessionId }),
    };
    const { error } = await supabase
      .from('certification_candidates')
      .update(updatePayload)
      .eq('id', examEligible.candidateId);
    setLaunching(false);
    if (error) setRequestError(error.message);
    else navigate('/incube/exam', { replace: true });
  };

  const openQuiz = async (module) => {
    setQuizResult(null);
    setQuizModule(module);
    setQuizAnswers({});
    const { data: questions } = await supabase
      .from('module_quiz_questions')
      .select('id, question_text, sort_order')
      .eq('module_id', module.id)
      .order('sort_order');
    const qs = questions ?? [];
    const withChoices = await Promise.all(
      qs.map(async (q) => {
        const { data: choices } = await supabase
          .from('module_quiz_choices')
          .select('id, choice_text, is_correct, sort_order')
          .eq('question_id', q.id)
          .order('sort_order');
        return { ...q, choices: choices ?? [] };
      })
    );
    const validQuestions = withChoices.filter(
      (q) => (q.question_text || '').trim() && (q.choices || []).length >= 2 && (q.choices || []).some((c) => c.is_correct)
    );
    setQuizQuestions(validQuestions);
  };

  const markModuleCompleted = async (module) => {
    if (!profile?.id || !module?.id) return;
    const { error } = await supabase.from('incube_module_progress').upsert(
      { incube_id: profile.id, module_id: module.id, completed_at: new Date().toISOString(), score_pct: null },
      { onConflict: 'incube_id,module_id' }
    );
    if (!error) {
      const { data: prog } = await supabase.from('incube_module_progress').select('module_id, completed_at, score_pct').eq('incube_id', profile.id);
      const byModule = {};
      (prog ?? []).forEach((p) => { byModule[p.module_id] = p; });
      setProgress(byModule);
    }
  };

  const submitQuiz = async () => {
    if (!quizModule || !profile?.id) return;
    const total = quizQuestions.length;
    let correct = 0;
    quizQuestions.forEach((q) => {
      const choiceId = quizAnswers[q.id];
      const choice = q.choices.find((c) => c.id === choiceId);
      if (choice?.is_correct) correct += 1;
    });
    const scorePct = total ? Math.round((correct / total) * 100 * 100) / 100 : 0;
    setQuizSubmitting(true);
    const { error } = await supabase.from('incube_module_progress').upsert(
      { incube_id: profile.id, module_id: quizModule.id, completed_at: new Date().toISOString(), score_pct: scorePct },
      { onConflict: 'incube_id,module_id' }
    );
    setQuizSubmitting(false);
    if (error) setRequestError(error.message);
    else {
      const passed = scorePct >= REQUIRED_QUIZ_SCORE_PCT;
      setQuizResult({ scorePct, passed });
      const { data: prog } = await supabase
        .from('incube_module_progress')
        .select('module_id, completed_at, score_pct')
        .eq('incube_id', profile.id);
      const byModule = {};
      (prog ?? []).forEach((p) => { byModule[p.module_id] = p; });
      setProgress(byModule);
      onRefreshProfile?.();
    }
  };

  const closeQuizModal = () => {
    setQuizResult(null);
    setQuizModule(null);
    setQuizQuestions([]);
    setQuizAnswers({});
  };

  const handleDemanderCoaching = async () => {
    if (!profile?.id || !coachId || !profile?.organisation_id) return;
    setSending(true);
    setRequestError(null);
    const { error } = await supabase.from('coaching_requests').insert({
      incube_id: profile.id,
      coach_id: coachId,
      organisation_id: profile.organisation_id,
      status: 'PENDING',
    });
    setSending(false);
    if (error) {
      setRequestError(error.message);
      return;
    }
    setRequestSent(true);
    const { data } = await supabase
      .from('coaching_requests')
      .select('id, message, status, created_at, responded_at')
      .eq('incube_id', profile.id)
      .order('created_at', { ascending: false });
    setCoachingRequestsHistory(data ?? []);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout?.();
    navigate('/login', { replace: true });
  };

  const p1 = profile?.p1_score != null ? Number(profile.p1_score) : null;
  const p2 = profile?.p2_score != null ? Number(profile.p2_score) : null;
  const niveau = getNiveauBadge(profile);
  const modulesDone = Object.values(progress).filter((p) => p?.completed_at).length;
  const modulesTotal = modules.length;

  /** Détermine si un module est débloqué : premier toujours ; suivant si le précédent est complété (quiz => score >= REQUIRED_QUIZ_SCORE_PCT). */
  const isModuleUnlocked = (module, index) => {
    if (index === 0) return true;
    const prev = modules[index - 1];
    const prevProg = progress[prev?.id];
    if (!prevProg?.completed_at) return false;
    if (prev.type === 'quiz' && prevProg.score_pct != null) return Number(prevProg.score_pct) >= REQUIRED_QUIZ_SCORE_PCT;
    return true;
  };

  const nextModule = modules.find((m, i) => isModuleUnlocked(m, i) && !progress[m.id]?.completed_at);

  const mainCtaLabel = examEligible.canLaunch
    ? "Lancer l'examen"
    : profile?.global_status === 'EXAM_IN_PROGRESS'
      ? "Reprendre l'examen"
      : nextModule
        ? 'Reprendre le parcours'
        : modulesTotal > 0
          ? 'Démarrer le parcours'
          : null;

  const openModuleAction = (module) => {
    if (!module) return;
    if (module.type === 'quiz') {
      openQuiz(module);
      return;
    }
    if (module.type === 'text' && (module.payload?.body || module.payload?.document_url)) {
      setContentModule(module);
      return;
    }
    if (module.type === 'video' && module.payload?.video_url) {
      setContentModule(module);
      return;
    }
    if (module.type === 'document' && module.payload?.document_url) {
      setContentModule(module);
      return;
    }
    markModuleCompleted(module).then(() => {
      parcoursSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }).catch(() => {});
  };

  const onMainCtaClick = () => {
    if (examEligible.canLaunch) handleLancerExamen();
    else if (profile?.global_status === 'EXAM_IN_PROGRESS') navigate('/incube/exam');
    else if (nextModule) openModuleAction(nextModule);
    else if (modules.length > 0) openModuleAction(modules[0]);
    else if (parcoursSectionRef.current) parcoursSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-cerip-forest-light via-cerip-forest-light to-cerip-forest/5">
      <header className="sticky top-0 z-10 h-14 flex items-center justify-between px-4 md:px-6 rounded-b-2xl md:mx-4 bg-white/95 backdrop-blur border-b border-cerip-forest/10 shadow-sm">
        <Link to="/incube" className="flex items-center gap-2">
          <img src="/logo-cerip-senegal.png" alt="CERIP" className="h-8 w-auto object-contain" />
          <span className="font-bold text-cerip-forest text-sm">Savana</span>
        </Link>
        <div className="flex items-center gap-2 md:gap-3">
          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold shadow-sm ${niveau.color}`} title="Ton niveau">
            {niveau.label}
          </span>
          <span className="text-xs text-cerip-forest/60 truncate max-w-[100px] md:max-w-[160px]" title={profile?.email}>{profile?.full_name || profile?.email}</span>
          <Link to="/profile" className="px-2 py-1.5 rounded-lg text-xs font-medium text-cerip-forest/80 hover:bg-cerip-forest/10" aria-label="Mon profil">Profil</Link>
          <button type="button" onClick={handleLogout} className="px-2 py-1.5 rounded-lg text-xs font-medium text-cerip-magenta hover:bg-cerip-magenta-light" aria-label="Déconnexion">Sortir</button>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6 space-y-6 max-w-4xl mx-auto w-full">
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-cerip-forest/90 via-cerip-forest-mid to-cerip-forest text-white p-6 md:p-8 shadow-xl border border-cerip-forest/20">
          <div className="relative z-10">
            <p className="text-cerip-lime font-semibold text-sm uppercase tracking-wider mb-1">Parcours Savana</p>
            <h1 className="text-2xl md:text-4xl font-bold leading-tight mb-2">De lionceau à Gaindé</h1>
            <p className="text-white/85 text-sm md:text-base mb-4">
              Les contenus sont proposés par ton organisation et tes coachs. Complète les étapes dans l&apos;ordre pour débloquer la suite.
            </p>
            {modulesTotal > 0 && (
              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-2.5 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-cerip-lime rounded-full transition-all duration-500" style={{ width: `${modulesTotal ? (modulesDone / modulesTotal) * 100 : 0}%` }} />
                </div>
                <span className="text-sm font-bold tabular-nums shrink-0">{modulesDone} / {modulesTotal} étapes</span>
              </div>
            )}
            {mainCtaLabel && (
              <button
                type="button"
                disabled={examEligible.canLaunch && launching}
                onClick={onMainCtaClick}
                className="w-full md:w-auto min-w-[200px] py-4 px-8 rounded-2xl text-lg font-bold bg-cerip-lime text-cerip-forest hover:bg-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70"
              >
                {examEligible.canLaunch && launching ? 'Lancement…' : mainCtaLabel}
              </button>
            )}
          </div>
          <div className="absolute bottom-0 right-0 w-32 h-32 md:w-40 md:h-40 bg-cerip-lime/10 rounded-full -translate-y-1/2 translate-x-1/2" aria-hidden />
        </section>

        <div className="rounded-xl bg-white/90 backdrop-blur border border-cerip-forest/10 px-4 py-3 flex flex-wrap items-center gap-4">
          <span className="text-sm font-medium text-cerip-forest">
            Phase actuelle : <strong>{profile?.current_parcours ?? '—'}</strong>
          </span>
          {profile?.p1_score != null && (
            <span className="text-xs text-cerip-forest/80 flex items-center gap-2">
              Score P1 : <span className="font-semibold tabular-nums">{Number(profile.p1_score)} %</span>
              <span className="w-12 h-1.5 bg-cerip-forest/10 rounded-full overflow-hidden" aria-hidden>
                <span className="block h-full bg-cerip-lime rounded-full" style={{ width: `${Math.min(100, Number(profile.p1_score))}%` }} />
              </span>
            </span>
          )}
          {profile?.current_parcours === 'P2' && (
            <span className="text-xs text-cerip-forest/80">
              Score P2 : <span className="font-semibold tabular-nums">{profile?.p2_score != null ? `${Number(profile.p2_score)} %` : '—'}</span>
            </span>
          )}
        </div>

        {requestError && (
          <div className="rounded-xl bg-cerip-magenta-light border border-cerip-magenta/30 text-cerip-magenta-dark text-sm px-4 py-3">{requestError}</div>
        )}


        <section ref={parcoursSectionRef} className="rounded-2xl bg-white/80 backdrop-blur border border-cerip-forest/10 shadow-sm p-5">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h2 className="text-lg font-bold text-cerip-forest">Parcours à la carte</h2>
            {profile?.current_parcours && (
              <span className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-cerip-forest/15 text-cerip-forest">
                Phase {profile.current_parcours}
              </span>
            )}
          </div>
          <p className="text-xs text-cerip-forest/70 mb-2">
            Quiz : note ≥ {REQUIRED_QUIZ_SCORE_PCT} % pour débloquer l&apos;étape suivante.
          </p>
          <p className="text-xs text-cerip-forest/70 mb-2">
            Besoin d&apos;aide ?{' '}
            {coachName && <span className="font-medium text-cerip-forest">Ton coach : {coachName}. </span>}
            {requestError && <span className="text-cerip-magenta">{requestError}</span>}
            {requestSent && <span className="text-cerip-lime font-medium">Demande envoyée, ton coach te recontactera.</span>}
            {!requestSent && coachId && (
              <button type="button" disabled={sending} onClick={handleDemanderCoaching} className="text-cerip-lime font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-cerip-lime rounded">
                {sending ? 'Envoi…' : 'Demande une session.'}
              </button>
            )}
            {!requestSent && !coachId && <span>Aucun coach assigné pour l&apos;instant.</span>}
          </p>
          {coachingRequestsHistory.length > 0 && (
            <div className="mb-4">
              <button
                type="button"
                onClick={() => setCoachingHistoryOpen((o) => !o)}
                className="text-xs font-medium text-cerip-forest/80 hover:text-cerip-forest flex items-center gap-1"
              >
                {coachingHistoryOpen ? 'Masquer' : 'Voir'} mes demandes de coaching ({coachingRequestsHistory.length})
              </button>
              {coachingHistoryOpen && (
                <ul className="mt-2 space-y-1 text-xs text-cerip-forest/80 border border-cerip-forest/10 rounded-lg p-2 bg-white/50">
                  {coachingRequestsHistory.map((r) => (
                    <li key={r.id}>
                      {new Date(r.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      {' · '}
                      <span className={r.status === 'PENDING' ? 'text-cerip-magenta font-medium' : ''}>
                        {r.status === 'PENDING' ? 'En attente' : 'Traité'}
                      </span>
                      {r.message && <span className="block mt-0.5 text-cerip-forest/70">{r.message}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {modulesLoading ? (
            <p className="text-sm text-cerip-forest/70">Chargement des modules…</p>
          ) : !profile?.current_parcours ? (
            <p className="text-sm text-cerip-forest/70">Ton parcours n&apos;est pas encore assigné. Contacte ton organisation.</p>
          ) : modules.length === 0 ? (
            <p className="text-sm text-cerip-forest/70">Aucun module pour le moment pour cette phase.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {modules.map((m, index) => {
                const prog = progress[m.id];
                const done = !!prog?.completed_at;
                const isQuiz = m.type === 'quiz';
                const unlocked = isModuleUnlocked(m, index);
                const scoreOk = isQuiz && prog?.score_pct != null && Number(prog.score_pct) >= REQUIRED_QUIZ_SCORE_PCT;
                const stepNum = index + 1;
                const stepTotal = modules.length;
                return (
                  <div
                    key={m.id}
                    className={`rounded-2xl border overflow-hidden transition-all duration-200 ${
                      !unlocked
                        ? 'border-cerip-forest/10 bg-cerip-forest/5 opacity-75'
                        : done
                          ? 'border-cerip-lime/30 bg-cerip-lime/5'
                          : 'border-cerip-forest/15 bg-white hover:shadow-md hover:border-cerip-forest/20'
                    }`}
                  >
                    <div className="h-24 bg-gradient-to-br from-cerip-forest/10 to-cerip-lime/10 flex items-center justify-center relative">
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-xs font-medium bg-white/80 text-cerip-forest/80">
                        Étape {stepNum} / {stepTotal}
                      </span>
                      {m.type === 'quiz' && (
                        <span className="w-12 h-12 rounded-full bg-cerip-lime/20 flex items-center justify-center text-cerip-lime" aria-hidden>?</span>
                      )}
                      {m.type === 'text' && (
                        <span className="w-12 h-12 rounded-full bg-cerip-forest/20 flex items-center justify-center text-cerip-forest" aria-hidden>📄</span>
                      )}
                      {m.type === 'video' && (
                        <span className="w-12 h-12 rounded-full bg-cerip-magenta/20 flex items-center justify-center text-cerip-magenta" aria-hidden>▶</span>
                      )}
                    </div>
                    <div className="p-4">
                      <p className="font-semibold text-cerip-forest text-sm">{m.title}</p>
                      {m.description && <p className="text-xs text-cerip-forest/70 mt-0.5 line-clamp-2">{m.description}</p>}
                      {done && (
                        <p className="text-xs font-medium mt-2 text-cerip-lime">
                          {prog?.score_pct != null ? `Complété · ${Number(prog.score_pct)} %` : 'Complété'}
                          {isQuiz && prog?.score_pct != null && (Number(prog.score_pct) >= REQUIRED_QUIZ_SCORE_PCT ? ' · Étape suivante débloquée' : ' · Rejouer pour débloquer')}
                        </p>
                      )}
                      {!unlocked && (
                        <p className="text-xs text-cerip-forest/70 mt-2">Complétez le module précédent (quiz : note ≥ {REQUIRED_QUIZ_SCORE_PCT} %).</p>
                      )}
                      <div className="mt-3">
                        {!unlocked ? (
                          <span className="inline-block px-3 py-1.5 rounded-lg text-xs font-medium bg-cerip-forest/10 text-cerip-forest/70">Verrouillé</span>
                        ) : m.type === 'video' ? (done ? (
                          <span className="text-xs text-cerip-lime font-medium">Marqué comme vu</span>
                        ) : m.payload?.video_url ? (
                          <button type="button" onClick={() => setContentModule(m)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-cerip-lime text-white hover:bg-cerip-lime-dark transition">Voir la vidéo</button>
                        ) : (
                          <button type="button" onClick={() => markModuleCompleted(m)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-cerip-lime text-white hover:bg-cerip-lime-dark transition">Marquer comme vu</button>
                        )                        ) : m.type === 'text' ? (done ? (
                          <span className="text-xs text-cerip-lime font-medium">Lu</span>
                        ) : (m.payload?.body || m.payload?.document_url) ? (
                          <button type="button" onClick={() => setContentModule(m)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-cerip-lime text-white hover:bg-cerip-lime-dark transition">Lire</button>
                        ) : (
                          <button type="button" onClick={() => markModuleCompleted(m)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-cerip-lime text-white hover:bg-cerip-lime-dark transition">Marquer comme lu</button>
                        )) : m.type === 'document' ? (done ? (
                          <span className="text-xs text-cerip-lime font-medium">Document consulté</span>
                        ) : m.payload?.document_url ? (
                          <button type="button" onClick={() => setContentModule(m)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-cerip-lime text-white hover:bg-cerip-lime-dark transition">Ouvrir le document</button>
                        ) : (
                          <button type="button" onClick={() => markModuleCompleted(m)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-cerip-lime text-white hover:bg-cerip-lime-dark transition">Marquer comme vu</button>
                        )) : (
                          <button type="button" onClick={() => openQuiz(m)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-cerip-lime text-white hover:bg-cerip-lime-dark transition">
                            {done ? 'Revoir le quiz' : 'Passer le quiz'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {quizModule && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" aria-modal="true" role="dialog">
              <div className="bg-white rounded-xl shadow-lg border border-cerip-forest/10 max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
                {quizResult ? (
                  <>
                    <h3 className="text-base font-semibold text-cerip-forest mb-2">Résultat</h3>
                    <p className="text-2xl font-bold text-cerip-lime mb-1">Bravo !</p>
                    <p className="text-sm text-cerip-forest/80 mb-2">Score : <strong className="tabular-nums">{quizResult.scorePct} %</strong></p>
                    <p className="text-sm text-cerip-forest/80 mb-6">
                      {quizResult.passed ? 'Étape suivante débloquée.' : `Rejoue pour débloquer (note ≥ ${REQUIRED_QUIZ_SCORE_PCT} %).`}
                    </p>
                    <button type="button" onClick={closeQuizModal} className="w-full py-3 rounded-xl text-sm font-semibold bg-cerip-lime text-white hover:bg-cerip-lime-dark transition">
                      Retour au parcours
                    </button>
                  </>
                ) : (
                  <>
                    <h3 className="text-base font-semibold text-cerip-forest mb-4">{quizModule.title}</h3>
                    <div className="space-y-4">
                      {quizQuestions.map((q) => (
                        <div key={q.id}>
                          <p className="text-sm font-medium text-cerip-forest mb-2">{q.question_text}</p>
                          <div className="space-y-1">
                            {q.choices.map((c) => (
                              <label key={c.id} className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name={`q-${q.id}`}
                                  checked={quizAnswers[q.id] === c.id}
                                  onChange={() => setQuizAnswers((a) => ({ ...a, [q.id]: c.id }))}
                                  className="text-cerip-lime focus:ring-cerip-lime"
                                />
                                <span className="text-sm text-cerip-forest/90">{c.choice_text}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 flex gap-2 justify-end">
                      <button type="button" onClick={closeQuizModal} className="px-3 py-2 rounded-lg text-sm font-medium text-cerip-forest/80 hover:bg-cerip-forest/10 transition">
                        Annuler
                      </button>
                      <button
                        type="button"
                        onClick={submitQuiz}
                        disabled={quizSubmitting || Object.keys(quizAnswers).length < quizQuestions.length}
                        className="px-4 py-2 rounded-lg text-sm font-medium bg-cerip-lime text-white hover:bg-cerip-lime-dark disabled:opacity-50 transition"
                      >
                        {quizSubmitting ? 'Envoi…' : 'Valider le quiz'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {contentModule && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto" aria-modal="true" role="dialog">
              <div className="bg-white rounded-xl shadow-lg border border-cerip-forest/10 max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 my-8">
                <h3 className="text-base font-semibold text-cerip-forest mb-4">{contentModule.title}</h3>
                {contentModule.type === 'text' && contentModule.payload?.body != null && contentModule.payload.body !== '' && (
                  <div className="text-sm text-cerip-forest/90 whitespace-pre-wrap mb-6">{contentModule.payload.body}</div>
                )}
                {contentModule.type === 'text' && contentModule.payload?.document_url && (
                  <p className="mb-6">
                    <a href={contentModule.payload.document_url} target="_blank" rel="noopener noreferrer" className="text-cerip-lime font-medium hover:underline">
                      Ouvrir le document (PDF, Google Docs, etc.)
                    </a>
                  </p>
                )}
                {contentModule.type === 'document' && contentModule.payload?.document_url && (
                  <p className="mb-6">
                    <a href={contentModule.payload.document_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-cerip-lime text-white hover:bg-cerip-lime-dark transition">
                      Ouvrir le document
                    </a>
                    <span className="block text-xs text-cerip-forest/70 mt-2">Le document s&apos;ouvrira dans un nouvel onglet.</span>
                  </p>
                )}
                {contentModule.type === 'video' && contentModule.payload?.video_url && (() => {
                  const embedUrl = getEmbedVideoUrl(contentModule.payload.video_url);
                  return embedUrl ? (
                    <div className="aspect-video mb-6">
                      <iframe title={contentModule.title} src={embedUrl} className="w-full h-full rounded-lg" allowFullScreen />
                    </div>
                  ) : (
                    <div className="mb-6">
                      <video controls className="w-full rounded-lg" src={contentModule.payload.video_url}>
                        Ton navigateur ne supporte pas la lecture. <a href={contentModule.payload.video_url} target="_blank" rel="noopener noreferrer" className="text-cerip-lime underline">Ouvrir le lien</a>
                      </video>
                    </div>
                  );
                })()}
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => setContentModule(null)} className="px-3 py-2 rounded-lg text-sm font-medium text-cerip-forest/80 hover:bg-cerip-forest/10 transition">
                    Fermer
                  </button>
                  <button type="button" onClick={() => { markModuleCompleted(contentModule); setContentModule(null); }} className="px-4 py-2 rounded-lg text-sm font-medium bg-cerip-lime text-white hover:bg-cerip-lime-dark transition">
                    {contentModule.type === 'text' ? 'Marquer comme lu' : contentModule.type === 'document' ? 'Marquer comme consulté' : 'Marquer comme vu'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="rounded-2xl bg-white/80 backdrop-blur border border-cerip-forest/10 shadow-sm p-4 mt-4">
          <h2 className="text-sm font-bold text-cerip-forest mb-2">Examen de certification</h2>
          {examEligible.canLaunch ? (
            <p className="text-xs text-cerip-forest/70 mb-2">
              Fenêtre ouverte.{examEligible.sessionEnd && ` Jusqu&apos;au ${new Date(examEligible.sessionEnd).toLocaleString('fr-FR')}.`}
            </p>
          ) : null}
          {examEligible.canLaunch ? (
            <button type="button" disabled={launching} onClick={handleLancerExamen} className="px-4 py-2 rounded-xl text-sm font-semibold bg-cerip-lime text-white hover:bg-cerip-lime-dark disabled:opacity-50 transition">
              {launching ? 'Lancement…' : "Lancer l'examen (QCM)"}
            </button>
          ) : profile?.global_status === 'EXAM_IN_PROGRESS' ? (
            <button type="button" onClick={() => navigate('/incube/exam')} className="px-4 py-2 rounded-xl text-sm font-semibold bg-cerip-lime text-white hover:bg-cerip-lime-dark transition">
              Continuer l&apos;examen
            </button>
          ) : (
            <p className="text-xs text-cerip-forest/70">
              Débloqué quand ton coach aura validé ton parcours (Clé 1) et qu&apos;une fenêtre d&apos;examen sera ouverte (Clé 2).
              {['COACH_VALIDATED', 'SESSION_SCHEDULED'].includes(profile?.global_status) && ' Tu es éligible ; date gérée par le Certificateur.'}
            </p>
          )}
        </section>
      </main>
    </div>
  );
}

export default IncubePortal;
