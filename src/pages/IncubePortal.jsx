import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import MetricCard from '../components/MetricCard';
import ProgressRing from '../components/ProgressRing';

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

/** Niveau gamifié : Lionceau → En chemin → Gaindé */
function getNiveauBadge(profile) {
  if (profile?.global_status === 'CERTIFIED') return { label: 'Gaindé', color: 'bg-cerip-lime text-white' };
  const p1 = profile?.p1_score != null ? Number(profile.p1_score) : 0;
  if (p1 >= 70 || profile?.current_parcours === 'P2') return { label: 'En chemin', color: 'bg-cerip-forest-mid text-white' };
  return { label: 'Lionceau', color: 'bg-cerip-magenta/15 text-cerip-magenta-dark' };
}

function IncubePortal({ profile, onRefreshProfile }) {
  const navigate = useNavigate();
  const [coachId, setCoachId] = useState(null);
  const [requestSent, setRequestSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [requestError, setRequestError] = useState(null);
  const [examEligible, setExamEligible] = useState({ canLaunch: false, candidateId: null, sessionEnd: null });
  const [launching, setLaunching] = useState(false);
  const [modules, setModules] = useState([]);
  const [progress, setProgress] = useState({});
  const [modulesLoading, setModulesLoading] = useState(false);
  const [quizModule, setQuizModule] = useState(null);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitting, setQuizSubmitting] = useState(false);

  useEffect(() => {
    if (!profile?.id) return;
    const fetchCoach = async () => {
      const { data } = await supabase
        .from('assignations')
        .select('coach_id')
        .eq('incube_id', profile.id)
        .limit(1);
      setCoachId(data?.[0]?.coach_id ?? null);
    };
    fetchCoach();
  }, [profile?.id]);

  useEffect(() => {
    if (!profile?.id || !profile?.organisation_id || !profile?.current_parcours) return;
    setModulesLoading(true);
    const load = async () => {
      const { data: mods } = await supabase
        .from('learning_modules')
        .select('id, title, description, sort_order, type')
        .or(`organisation_id.eq.${profile.organisation_id},organisation_id.is.null`)
        .eq('parcours_phase', profile.current_parcours)
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
        setExamEligible({ canLaunch: false, candidateId: null, sessionEnd: null });
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
          ? { canLaunch: true, candidateId: candidate.id, sessionEnd: openSession.end_at }
          : { canLaunch: false, candidateId: null, sessionEnd: null }
      );
    };
    checkExam();
  }, [profile?.id, profile?.organisation_id]);

  const handleLancerExamen = async () => {
    if (!examEligible.candidateId) return;
    setLaunching(true);
    setRequestError(null);
    const { error } = await supabase
      .from('certification_candidates')
      .update({ exam_status: 'IN_PROGRESS', exam_started_at: new Date().toISOString() })
      .eq('id', examEligible.candidateId);
    setLaunching(false);
    if (error) setRequestError(error.message);
    else navigate('/incube/exam', { replace: true });
  };

  const openQuiz = async (module) => {
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
    setQuizQuestions(withChoices);
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
      setQuizModule(null);
      setQuizQuestions([]);
      setQuizAnswers({});
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
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login', { replace: true });
  };

  const p1 = profile?.p1_score != null ? Number(profile.p1_score) : null;
  const p2 = profile?.p2_score != null ? Number(profile.p2_score) : null;
  const statusLabel = STATUS_LABELS[profile?.global_status] ?? profile?.global_status;
  const niveau = getNiveauBadge(profile);
  const modulesDone = Object.values(progress).filter((p) => p?.completed_at).length;
  const modulesTotal = modules.length;
  const nextModule = modules.find((m) => !progress[m.id]?.completed_at);
  const prochaineEtape = examEligible.canLaunch
    ? { type: 'exam', label: "Lancer l'examen de certification", cta: "Lancer l'examen" }
    : profile?.global_status === 'EXAM_IN_PROGRESS'
      ? { type: 'exam', label: "Reprendre l'examen en cours", cta: 'Continuer' }
      : !requestSent && coachId
        ? { type: 'coaching', label: 'Demander une session de coaching', cta: 'Demander une session' }
        : nextModule
          ? { type: 'module', label: nextModule.title, cta: nextModule.type === 'quiz' ? 'Passer le quiz' : nextModule.type === 'text' ? 'Marquer comme lu' : 'Marquer comme vu' }
          : null;

  return (
    <div className="flex min-h-screen bg-cerip-forest-light flex-col">
      <header className="h-14 flex items-center justify-between px-4 md:px-6 border-b border-cerip-forest/10 bg-white shadow-sm">
        <div className="flex items-center gap-2">
          <Link to="/incube" className="flex items-center gap-2">
            <img src="/logo-cerip-senegal.png" alt="CERIP" className="h-8 w-auto object-contain" />
            <span className="font-semibold text-cerip-forest text-sm">Savana · Espace Incubé</span>
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-cerip-forest/70 truncate max-w-[120px] md:max-w-none" title={profile?.email}>{profile?.full_name || profile?.email}</span>
          <Link
            to="/profile"
            className="px-3 py-2 rounded-lg text-sm font-medium text-cerip-forest/80 hover:bg-cerip-forest/5 hover:text-cerip-forest transition"
          >
            Mon profil
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="px-3 py-2 rounded-lg text-sm font-medium text-cerip-magenta hover:bg-cerip-magenta-light transition"
          >
            Déconnexion
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-cerip-forest">Mon parcours</h1>
            <p className="text-sm text-cerip-forest/70 mt-1">De lionceau à Gaindé — suivi de votre progression et accès à la certification.</p>
          </div>
          <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold shadow-sm ${niveau.color}`}>
            {niveau.label}
          </span>
        </div>

        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <div className="dashboard-card bg-white rounded-2xl shadow-sm border border-cerip-forest/10 p-5 hover:shadow-md hover:border-cerip-forest/15 hover:-translate-y-0.5 transition-all duration-300 ease-out" style={{ animationDelay: '0ms' }}>
            <p className="text-xs font-semibold uppercase tracking-wider text-cerip-forest/70 mb-2">Score P1</p>
            <div className="flex items-center gap-3">
              <ProgressRing value={p1 ?? 0} size={64} stroke={6} label="" />
              <span className="text-2xl font-bold text-cerip-forest tabular-nums">{p1 != null ? `${Math.round(p1)} %` : '—'}</span>
            </div>
          </div>
          <div className="dashboard-card bg-white rounded-2xl shadow-sm border border-cerip-forest/10 p-5 hover:shadow-md hover:border-cerip-forest/15 hover:-translate-y-0.5 transition-all duration-300 ease-out" style={{ animationDelay: '60ms' }}>
            <p className="text-xs font-semibold uppercase tracking-wider text-cerip-forest/70 mb-2">Score P2</p>
            <div className="flex items-center gap-3">
              <ProgressRing value={p2 ?? 0} size={64} stroke={6} label="" />
              <span className="text-2xl font-bold text-cerip-forest tabular-nums">{p2 != null ? `${Math.round(p2)} %` : '—'}</span>
            </div>
          </div>
          <MetricCard label="Parcours" value={profile?.current_parcours ?? '—'} subText="Phase actuelle" animationDelay={120} />
          <MetricCard label="Modules complétés" value={modulesTotal ? `${modulesDone} / ${modulesTotal}` : '—'} subText={modulesTotal ? `${Math.round((modulesDone / modulesTotal) * 100)} %` : ''} animationDelay={180} />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="dashboard-card bg-white rounded-2xl shadow-sm border border-cerip-forest/10 p-5 hover:shadow-md hover:border-cerip-forest/15 transition-all duration-300" style={{ animationDelay: '200ms' }}>
            <p className="text-xs font-semibold uppercase tracking-wider text-cerip-forest/70 mb-1">Statut</p>
            <p className="text-lg font-semibold text-cerip-forest">{statusLabel}</p>
          </div>
          {prochaineEtape && (
            <div
              className="dashboard-card bg-gradient-to-br from-cerip-forest/5 to-cerip-lime/10 rounded-2xl border border-cerip-lime/20 p-5 hover:shadow-md hover:border-cerip-lime/30 transition-all duration-300"
              style={{ animationDelay: '240ms' }}
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-cerip-forest/70 mb-1">Prochaine étape</p>
              <p className="text-sm font-medium text-cerip-forest mb-3">{prochaineEtape.label}</p>
              {prochaineEtape.type === 'exam' && (
                <button
                  type="button"
                  disabled={launching}
                  onClick={prochaineEtape.cta === 'Continuer' ? () => navigate('/incube/exam') : handleLancerExamen}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-cerip-lime text-white hover:bg-cerip-lime-dark shadow-sm transition"
                >
                  {launching ? 'Lancement…' : prochaineEtape.cta}
                </button>
              )}
              {prochaineEtape.type === 'coaching' && !requestSent && (
                <button
                  type="button"
                  disabled={sending}
                  onClick={handleDemanderCoaching}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-cerip-lime text-white hover:bg-cerip-lime-dark shadow-sm transition inline-flex items-center gap-2"
                >
                  {sending ? 'Envoi…' : <><span aria-hidden>✋</span> {prochaineEtape.cta}</>}
                </button>
              )}
              {prochaineEtape.type === 'module' && nextModule && (
                <button
                  type="button"
                  onClick={() => (nextModule.type === 'quiz' ? openQuiz(nextModule) : markModuleCompleted(nextModule))}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-cerip-lime text-white hover:bg-cerip-lime-dark shadow-sm transition"
                >
                  {prochaineEtape.cta}
                </button>
              )}
            </div>
          )}
        </div>

        <section className="bg-white rounded-2xl shadow-sm border border-cerip-forest/10 p-5 dashboard-card" style={{ animationDelay: '280ms' }}>
          <h2 className="text-base font-semibold text-cerip-forest mb-2">Demander une session de coaching</h2>
          <p className="text-xs text-cerip-forest/70 mb-4">
            Levée de main : signalez à votre coach que vous souhaitez un échange ou un accompagnement.
          </p>
          {requestError && (
            <p className="text-xs text-cerip-magenta bg-cerip-magenta-light rounded-lg px-3 py-2 mb-3">{requestError}</p>
          )}
          {requestSent ? (
            <p className="text-sm text-cerip-lime font-medium inline-flex items-center gap-2">✓ Demande envoyée. Votre coach vous recontactera.</p>
          ) : coachId ? (
            <button
              type="button"
              disabled={sending}
              onClick={handleDemanderCoaching}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-cerip-lime text-white hover:bg-cerip-lime-dark disabled:opacity-50 transition inline-flex items-center gap-2"
            >
              {sending ? 'Envoi…' : <><span aria-hidden>✋</span> Demander une session de coaching</>}
            </button>
          ) : (
            <p className="text-sm text-cerip-forest/70">Aucun coach assigné pour le moment. L'Admin de votre organisation effectuera le matrixage.</p>
          )}
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-cerip-forest/10 p-5 dashboard-card" style={{ animationDelay: '320ms' }}>
          <h2 className="text-base font-semibold text-cerip-forest mb-2">Modules de formation</h2>
          <p className="text-xs text-cerip-forest/70 mb-4">
            Parcours {profile?.current_parcours ?? '—'} — consultez les contenus et validez les quiz pour faire progresser votre score.
          </p>
          {modulesLoading ? (
            <p className="text-sm text-cerip-forest/70">Chargement des modules…</p>
          ) : modules.length === 0 ? (
            <p className="text-sm text-cerip-forest/70">Aucun module pour le moment pour cette phase.</p>
          ) : (
            <ul className="space-y-2">
              {modules.map((m) => {
                const prog = progress[m.id];
                const done = !!prog?.completed_at;
                const isQuiz = m.type === 'quiz';
                return (
                  <li
                    key={m.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-cerip-forest/10 bg-cerip-forest-light/30 px-4 py-3 hover:border-cerip-forest/15 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-cerip-forest text-sm">{m.title}</p>
                      {m.description && <p className="text-xs text-cerip-forest/70">{m.description}</p>}
                      {done && (
                        <p className="text-xs text-cerip-lime font-medium mt-0.5">
                          {prog?.score_pct != null ? `Complété · ${Number(prog.score_pct)} %` : 'Complété'}
                        </p>
                      )}
                    </div>
                    <div>
                      {m.type === 'video' && (done ? <span className="text-xs text-cerip-lime font-medium">Marqué comme vu</span> : (
                        <button type="button" onClick={() => markModuleCompleted(m)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-cerip-lime text-white hover:bg-cerip-lime-dark transition">Marquer comme vu</button>
                      ))}
                      {m.type === 'text' && (done ? <span className="text-xs text-cerip-lime font-medium">Lu</span> : (
                        <button type="button" onClick={() => markModuleCompleted(m)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-cerip-lime text-white hover:bg-cerip-lime-dark transition">Marquer comme lu</button>
                      ))}
                      {isQuiz && (
                        <button
                          type="button"
                          onClick={() => openQuiz(m)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-cerip-lime text-white hover:bg-cerip-lime-dark transition"
                        >
                          {done ? 'Revoir le quiz' : 'Passer le quiz'}
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {quizModule && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" aria-modal="true" role="dialog">
              <div className="bg-white rounded-xl shadow-lg border border-cerip-forest/10 max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
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
                  <button
                    type="button"
                    onClick={() => { setQuizModule(null); setQuizQuestions([]); setQuizAnswers({}); }}
                    className="px-3 py-2 rounded-lg text-sm font-medium text-cerip-forest/80 hover:bg-cerip-forest/10 transition"
                  >
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
              </div>
            </div>
          )}
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-cerip-forest/5 p-4">
          <h2 className="text-sm font-semibold text-cerip-forest mb-2">Examen de certification</h2>
          {requestError && <p className="text-xs text-cerip-magenta bg-cerip-magenta-light rounded-lg px-3 py-2 mb-3">{requestError}</p>}
          {examEligible.canLaunch ? (
            <>
              <p className="text-xs text-cerip-forest/70 mb-3">
                La fenêtre d'examen est ouverte (Clé 2). Vous pouvez lancer le QCM chronométré.
                {examEligible.sessionEnd && (
                  <span className="block mt-1 text-cerip-forest/80">
                    Fenêtre ouverte jusqu'au {new Date(examEligible.sessionEnd).toLocaleString('fr-FR')}.
                  </span>
                )}
              </p>
              <button
                type="button"
                disabled={launching}
                onClick={handleLancerExamen}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-cerip-lime text-white hover:bg-cerip-lime-dark disabled:opacity-50 transition"
              >
                {launching ? 'Lancement…' : "Lancer l'examen (QCM)"}
              </button>
            </>
          ) : (
            <>
              <p className="text-xs text-cerip-forest/70">
                Le bouton pour lancer le QCM chronométré apparaîtra lorsque votre coach aura validé votre parcours (Clé 1) et qu&apos;une fenêtre d&apos;examen sera ouverte (Clé 2).
              </p>
              {['COACH_VALIDATED', 'SESSION_SCHEDULED'].includes(profile?.global_status) && (
                <p className="mt-2 text-sm text-cerip-forest/80">Vous êtes éligible. La date et l'ouverture de l'examen sont gérées par le Certificateur.</p>
              )}
              {profile?.global_status === 'EXAM_IN_PROGRESS' && (
                <button
                  type="button"
                  onClick={() => navigate('/incube/exam')}
                  className="mt-2 px-4 py-2 rounded-lg text-sm font-medium bg-cerip-lime text-white hover:bg-cerip-lime-dark transition"
                >
                  Continuer l'examen
                </button>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}

export default IncubePortal;
