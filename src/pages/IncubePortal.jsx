import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  const [coachingRequestsHistory, setCoachingRequestsHistory] = useState([]);
  const [coachingHistoryOpen, setCoachingHistoryOpen] = useState(false);
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
  // Vision client : onglets, mois, toolbox, SOS, RDV, messagerie
  const [activeTab, setActiveTab] = useState('savanna');
  const [activeMois, setActiveMois] = useState(1);
  const [moisValidated, setMoisValidated] = useState(new Set());
  const [toolboxDocuments, setToolboxDocuments] = useState([]);
  const [toolboxOpen, setToolboxOpen] = useState(false);
  const [rdvModalOpen, setRdvModalOpen] = useState(false);
  const [rdvMessage, setRdvMessage] = useState('');
  const [rdvSending, setRdvSending] = useState(false);
  const [messagerieOpen, setMessagerieOpen] = useState(false);
  const [messagesList, setMessagesList] = useState([]);
  const [newMessageBody, setNewMessageBody] = useState('');
  const [messageSending, setMessageSending] = useState(false);
  const [sosUrgenceOpen, setSosUrgenceOpen] = useState(false);
  const [sosUrgenceBody, setSosUrgenceBody] = useState('');
  const [sosUrgenceSending, setSosUrgenceSending] = useState(false);
  const [sosCoachOpen, setSosCoachOpen] = useState(false);
  const [sosCoachMessage, setSosCoachMessage] = useState('');
  const [mesRdvOpen, setMesRdvOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [retryDeps, setRetryDeps] = useState({ coach: 0, coaching: 0, mois: 0, toolbox: 0, messages: 0, modules: 0 });
  const [signedDocumentUrl, setSignedDocumentUrl] = useState(null);
  const [signedVideoUrl, setSignedVideoUrl] = useState(null);

  useEffect(() => {
    if (!contentModule) {
      setSignedDocumentUrl(null);
      setSignedVideoUrl(null);
      return;
    }
    const p = contentModule.payload || {};
    if (p.document_file_path) {
      supabase.storage.from('module-assets').createSignedUrl(p.document_file_path, 3600).then(({ data }) => {
        setSignedDocumentUrl(data?.signedUrl ?? null);
      }).catch(() => setSignedDocumentUrl(null));
    } else setSignedDocumentUrl(null);
    if (p.video_file_path) {
      supabase.storage.from('module-assets').createSignedUrl(p.video_file_path, 3600).then(({ data }) => {
        setSignedVideoUrl(data?.signedUrl ?? null);
      }).catch(() => setSignedVideoUrl(null));
    } else setSignedVideoUrl(null);
  }, [contentModule?.id, contentModule?.payload?.document_file_path, contentModule?.payload?.video_file_path]);

  const retryLoad = (scope) => {
    setLoadError(null);
    setRetryDeps((prev) => ({ ...prev, [scope]: prev[scope] + 1 }));
  };

  // Coach dérivé des assignations (incube → promotion → coach). "Aucun coach assigné" uniquement si aucune ligne.
  useEffect(() => {
    if (!profile?.id) return;
    setLoadError((prev) => (prev?.scope === 'coach' ? null : prev));
    const fetchCoach = async () => {
      try {
        const { data, error } = await supabase
          .from('assignations')
          .select('coach_id')
          .eq('incube_id', profile.id)
          .limit(1);
        if (error) throw error;
        const cid = data?.[0]?.coach_id ?? null;
        setCoachId(cid);
        if (cid) {
          const { data: staff, error: staffError } = await supabase
            .from('staff_users')
            .select('full_name')
            .eq('id', cid)
            .single();
          if (staffError) throw staffError;
          setCoachName(staff?.full_name ?? null);
        } else {
          setCoachName(null);
        }
      } catch (e) {
        setLoadError({ scope: 'coach', message: e?.message || 'Erreur de chargement du coach.' });
      }
    };
    fetchCoach();
  }, [profile?.id, retryDeps.coach]);

  useEffect(() => {
    if (!profile?.id) return;
    setLoadError((prev) => (prev?.scope === 'coaching' ? null : prev));
    const fetchCoachingHistory = async () => {
      try {
        const { data, error } = await supabase
          .from('coaching_requests')
          .select('id, message, status, created_at, responded_at, request_type, objectif, travail_preparatoire, scheduled_at, platform, meeting_link')
          .eq('incube_id', profile.id)
          .order('created_at', { ascending: false });
        if (error) throw error;
        setCoachingRequestsHistory(data ?? []);
      } catch (e) {
        setLoadError({ scope: 'coaching', message: e?.message || 'Erreur de chargement des demandes.' });
      }
    };
    fetchCoachingHistory();
  }, [profile?.id, retryDeps.coaching]);

  useEffect(() => {
    if (!profile?.id) return;
    setLoadError((prev) => (prev?.scope === 'mois' ? null : prev));
    const fetchMoisValidated = async () => {
      try {
        const { data, error } = await supabase
          .from('incube_mois_validation')
          .select('mois_num')
          .eq('incube_id', profile.id);
        if (error) throw error;
        setMoisValidated(new Set((data ?? []).map((r) => r.mois_num)));
      } catch (e) {
        setLoadError({ scope: 'mois', message: e?.message || 'Erreur de chargement des mois validés.' });
      }
    };
    fetchMoisValidated();
  }, [profile?.id, retryDeps.mois]);

  useEffect(() => {
    if (!profile?.organisation_id) return;
    setLoadError((prev) => (prev?.scope === 'toolbox' ? null : prev));
    const fetchToolbox = async () => {
      try {
        const { data, error } = await supabase
          .from('toolbox_documents')
          .select('id, title, type, file_url, sort_order')
          .eq('organisation_id', profile.organisation_id)
          .order('sort_order');
        if (error) throw error;
        setToolboxDocuments(data ?? []);
      } catch (e) {
        setLoadError({ scope: 'toolbox', message: e?.message || 'Erreur de chargement de la boîte à outils.' });
      }
    };
    fetchToolbox();
  }, [profile?.organisation_id, retryDeps.toolbox]);

  useEffect(() => {
    if (!profile?.id || !coachId) return;
    setLoadError((prev) => (prev?.scope === 'messages' ? null : prev));
    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('coach_incube_messages')
          .select('id, body, is_urgence, from_incube, created_at')
          .eq('incube_id', profile.id)
          .eq('coach_id', coachId)
          .order('created_at', { ascending: true });
        if (error) throw error;
        setMessagesList(data ?? []);
      } catch (e) {
        setLoadError({ scope: 'messages', message: e?.message || 'Erreur de chargement des messages.' });
      }
    };
    fetchMessages();
  }, [profile?.id, coachId, retryDeps.messages]);

  useEffect(() => {
    if (!profile?.id || !profile?.organisation_id || !profile?.current_parcours) return;
    setLoadError((prev) => (prev?.scope === 'modules' ? null : prev));
    setModulesLoading(true);
    const load = async () => {
      try {
        const { data: assignationsData } = await supabase
          .from('assignations')
          .select('promotion_id')
          .eq('incube_id', profile.id);
        const promotionIds = [...new Set((assignationsData ?? []).map((a) => a.promotion_id).filter(Boolean))];
        const { data: mods, error: modsError } = await supabase
          .from('learning_modules')
          .select('id, title, description, sort_order, type, payload, parcours_phase, mois, promotion_id')
          .or(`organisation_id.eq.${profile.organisation_id},organisation_id.is.null`)
          .or(`parcours_phase.eq.${profile.current_parcours},parcours_phase.eq.P3`)
          .order('sort_order');
        if (modsError) throw modsError;
        const filtered = (mods ?? []).filter(
          (m) => m.promotion_id == null || promotionIds.length === 0 || promotionIds.includes(m.promotion_id)
        );
        setModules(filtered);
        const { data: prog, error: progError } = await supabase
          .from('incube_module_progress')
          .select('module_id, completed_at, score_pct')
          .eq('incube_id', profile.id);
        if (progError) throw progError;
        const byModule = {};
        (prog ?? []).forEach((p) => { byModule[p.module_id] = p; });
        setProgress(byModule);
      } catch (e) {
        setLoadError({ scope: 'modules', message: e?.message || 'Erreur de chargement des modules.' });
      } finally {
        setModulesLoading(false);
      }
    };
    load();
  }, [profile?.id, profile?.organisation_id, profile?.current_parcours, retryDeps.modules]);

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
      message: sosCoachMessage?.trim() || null,
    });
    setSending(false);
    if (error) {
      setRequestError(error.message);
      return;
    }
    setRequestSent(true);
    setSosCoachMessage('');
    setSosCoachOpen(false);
    const { data } = await supabase
      .from('coaching_requests')
      .select('id, message, status, created_at, responded_at')
      .eq('incube_id', profile.id)
      .order('created_at', { ascending: false });
    setCoachingRequestsHistory(data ?? []);
  };

  const handleDemanderRdv = async () => {
    if (!profile?.id || !coachId || !profile?.organisation_id) return;
    setRdvSending(true);
    setRequestError(null);
    const { error } = await supabase.from('coaching_requests').insert({
      incube_id: profile.id,
      coach_id: coachId,
      organisation_id: profile.organisation_id,
      status: 'PENDING',
      message: rdvMessage.trim() || null,
      request_type: 'RDV',
    });
    setRdvSending(false);
    if (error) setRequestError(error.message);
    else {
      setRdvModalOpen(false);
      setRdvMessage('');
      const { data } = await supabase.from('coaching_requests').select('id, message, status, created_at, request_type, objectif, travail_preparatoire, scheduled_at, platform, meeting_link').eq('incube_id', profile.id).order('created_at', { ascending: false });
      setCoachingRequestsHistory(data ?? []);
    }
  };

  const handleSendMessage = async () => {
    if (!profile?.id || !coachId || !newMessageBody.trim()) return;
    setMessageSending(true);
    setRequestError(null);
    const { error } = await supabase.from('coach_incube_messages').insert({
      incube_id: profile.id,
      coach_id: coachId,
      body: newMessageBody.trim(),
      is_urgence: false,
      from_incube: true,
    });
    setMessageSending(false);
    if (error) setRequestError(error.message);
    else {
      setNewMessageBody('');
      const { data } = await supabase.from('coach_incube_messages').select('id, body, is_urgence, from_incube, created_at').eq('incube_id', profile.id).eq('coach_id', coachId).order('created_at', { ascending: true });
      setMessagesList(data ?? []);
    }
  };

  const handleSosUrgence = async () => {
    if (!profile?.id || !coachId || !sosUrgenceBody.trim()) return;
    setSosUrgenceSending(true);
    setRequestError(null);
    const { error } = await supabase.from('coach_incube_messages').insert({
      incube_id: profile.id,
      coach_id: coachId,
      body: sosUrgenceBody.trim(),
      is_urgence: true,
      from_incube: true,
    });
    setSosUrgenceSending(false);
    if (error) setRequestError(error.message);
    else {
      setSosUrgenceOpen(false);
      setSosUrgenceBody('');
      const { data } = await supabase.from('coach_incube_messages').select('id, body, is_urgence, from_incube, created_at').eq('incube_id', profile.id).eq('coach_id', coachId).order('created_at', { ascending: true });
      setMessagesList(data ?? []);
    }
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

  const isModuleUnlockedInList = (list, module, index) => {
    if (index === 0) return true;
    const prev = list[index - 1];
    const prevProg = progress[prev?.id];
    if (!prevProg?.completed_at) return false;
    if (prev.type === 'quiz' && prevProg.score_pct != null) return Number(prevProg.score_pct) >= REQUIRED_QUIZ_SCORE_PCT;
    return true;
  };

  const nextModule = modules.find((m, i) => isModuleUnlocked(m, i) && !progress[m.id]?.completed_at);

  const pendingCoachingCount = coachingRequestsHistory.filter((r) => r.status === 'PENDING').length;

  const moisList = useMemo(() => {
    const set = new Set();
    modules.forEach((m) => { if (m.mois != null) set.add(m.mois); });
    const arr = [...set].sort((a, b) => a - b);
    return arr.length > 0 ? arr : [1];
  }, [modules]);

  useEffect(() => {
    if (moisList.length === 0) return;
    setActiveMois((prev) => (moisList.includes(prev) ? prev : moisList[0]));
  }, [moisList]);

  const isMoisUnlocked = (moisNum) => {
    const idx = moisList.indexOf(moisNum);
    if (idx <= 0) return true;
    return moisValidated.has(moisList[idx - 1]);
  };

  const modulesFilteredByMois = modules.filter((m) => m.mois == null || m.mois === activeMois);
  const modulesTheorie = modulesFilteredByMois.filter((m) => m.type === 'text' || m.type === 'video');
  const modulesTotalMois = modulesFilteredByMois.length;
  const modulesDoneMois = modulesFilteredByMois.filter((m) => progress[m.id]?.completed_at).length;

  const mainCtaLabel = nextModule || modulesDone > 0
    ? 'Continuer mon parcours'
    : modulesTotal > 0
      ? 'Démarrer mon parcours'
      : null;

  const openModuleAction = (module) => {
    if (!module) return;
    if (module.type === 'quiz') {
      openQuiz(module);
      return;
    }
    if (module.type === 'text' && (module.payload?.body || module.payload?.document_url || module.payload?.document_file_path)) {
      setContentModule(module);
      return;
    }
    if (module.type === 'video' && (module.payload?.video_url || module.payload?.video_file_path)) {
      setContentModule(module);
      return;
    }
    if (module.type === 'document' && (module.payload?.document_url || module.payload?.document_file_path)) {
      setContentModule(module);
      return;
    }
    markModuleCompleted(module).then(() => {
      parcoursSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }).catch(() => {});
  };

  const onMainCtaClick = () => {
    if (nextModule) {
      openModuleAction(nextModule);
      setTimeout(() => parcoursSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } else if (modules.length > 0) {
      openModuleAction(modules[0]);
      setTimeout(() => parcoursSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } else if (parcoursSectionRef.current) {
      parcoursSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gradient-to-b from-cerip-forest-light via-cerip-forest-light to-cerip-forest/5">
      <header className="shrink-0 sticky top-0 z-10 h-14 flex items-center justify-between px-4 md:px-6 rounded-b-2xl md:mx-4 bg-white/95 backdrop-blur border-b border-cerip-forest/10 shadow-sm">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setSidebarOpen((o) => !o)} className="md:hidden p-2 rounded-lg text-cerip-forest hover:bg-cerip-forest/10" aria-label="Menu" aria-expanded={sidebarOpen}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <Link to="/incube" className="flex items-center gap-2">
            <img src="/logo-cerip-senegal.png" alt="CERIP" className="h-8 w-auto object-contain" />
            <span className="font-bold text-cerip-forest text-sm">Savana</span>
          </Link>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold shadow-sm ${niveau.color}`} title="Ton niveau">
            {niveau.label}
          </span>
          <span className="text-xs text-cerip-forest/60 truncate max-w-[100px] md:max-w-[160px]" title={profile?.email}>{profile?.full_name || profile?.email}</span>
          <Link to="/profile" className="px-2 py-1.5 rounded-lg text-xs font-medium text-cerip-forest/80 hover:bg-cerip-forest/10" aria-label="Mon profil">Profil</Link>
          <button type="button" onClick={handleLogout} className="px-2 py-1.5 rounded-lg text-xs font-medium text-cerip-magenta hover:bg-cerip-magenta-light" aria-label="Déconnexion">Sortir</button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {sidebarOpen && (
          <button type="button" onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-30 bg-black/50 md:hidden" aria-label="Fermer le menu" />
        )}
        <aside className={`fixed md:relative inset-y-0 left-0 z-40 w-64 md:w-52 shrink-0 bg-cerip-forest/95 text-white flex flex-col p-3 gap-2 transform transition-transform duration-200 ease-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
          <div className="flex items-center justify-between md:block">
            <p className="text-cerip-lime font-semibold text-xs uppercase tracking-wider px-2">Savana</p>
            <button type="button" onClick={() => setSidebarOpen(false)} className="md:hidden p-2 rounded-lg text-white hover:bg-white/10" aria-label="Fermer le menu">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <p className="text-white font-medium text-sm px-2">Bienvenue, {profile?.full_name?.trim() ? (profile.full_name.split(/\s+/)[0] || profile.full_name) : (profile?.email ?? 'Étudiant')}</p>
          <p className="text-white/80 text-xs px-2 mb-2">Étudiant</p>
          <div className="space-y-1">
            {moisList.map((num) => {
              const unlocked = isMoisUnlocked(num);
              return (
                <button
                  key={num}
                  type="button"
                  onClick={() => { if (unlocked) { setActiveMois(num); setSidebarOpen(false); } }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-between ${activeMois === num ? 'bg-cerip-lime text-cerip-forest' : unlocked ? 'hover:bg-white/10 text-white' : 'text-white/50 cursor-not-allowed'}`}
                >
                  MOIS {num}
                  {!unlocked && <span className="text-xs" aria-hidden>🔒</span>}
                </button>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-white/20 space-y-1">
            <button type="button" onClick={() => { setToolboxOpen(true); setSidebarOpen(false); }} className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-white hover:bg-white/10 flex items-center gap-2">
              <span aria-hidden>🔧</span> BOÎTE À OUTILS
            </button>
            <button type="button" onClick={() => { setSosCoachOpen(true); setMessagerieOpen(false); setSidebarOpen(false); }} className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-white hover:bg-white/10 flex items-center justify-between">
              <span>SOS COACH</span>
              {pendingCoachingCount > 0 && <span className="bg-cerip-magenta text-white text-xs font-bold rounded-full min-w-[1.25rem] h-5 flex items-center justify-center px-1">({pendingCoachingCount})</span>}
            </button>
            <button type="button" onClick={() => { setRdvModalOpen(true); setSidebarOpen(false); }} className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-white hover:bg-white/10">
              DEMANDER RDV
            </button>
            <button type="button" onClick={() => { setMesRdvOpen(true); setSidebarOpen(false); }} className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-white hover:bg-white/10 flex items-center justify-between">
              MES RDV
              {coachingRequestsHistory.filter((r) => r.request_type === 'RDV').length > 0 && (
                <span className="bg-cerip-lime/30 text-cerip-forest text-xs font-bold rounded-full min-w-[1.25rem] h-5 flex items-center justify-center px-1">
                  {coachingRequestsHistory.filter((r) => r.request_type === 'RDV').length}
                </span>
              )}
            </button>
            <button type="button" onClick={() => { setMessagerieOpen(true); setSidebarOpen(false); }} className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-white hover:bg-white/10">
              MESSAGERIE
            </button>
            <button type="button" onClick={() => { setSosUrgenceOpen(true); setSidebarOpen(false); }} className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-white hover:bg-white/10">
              SOS URGENCE
            </button>
          </div>
        </aside>

      <main className="flex-1 min-h-0 min-w-0 p-4 md:p-6 space-y-4 overflow-auto">
        {loadError && (
          <div className="rounded-xl bg-cerip-magenta-light border border-cerip-magenta/30 text-cerip-magenta-dark text-sm px-4 py-3 flex flex-wrap items-center justify-between gap-2">
            <span>
              {loadError.scope === 'coach' && 'Coach : '}
              {loadError.scope === 'coaching' && 'Demandes : '}
              {loadError.scope === 'mois' && 'Mois validés : '}
              {loadError.scope === 'toolbox' && 'Boîte à outils : '}
              {loadError.scope === 'messages' && 'Messages : '}
              {loadError.scope === 'modules' && 'Modules : '}
              {loadError.message}
            </span>
            <button type="button" onClick={() => retryLoad(loadError.scope)} className="px-3 py-1.5 rounded-lg font-medium bg-cerip-magenta/20 hover:bg-cerip-magenta/30">
              Réessayer
            </button>
          </div>
        )}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-cerip-forest/90 via-cerip-forest-mid to-cerip-forest text-white p-6 md:p-8 shadow-xl border border-cerip-forest/20">
          <div className="relative z-10">
            <p className="text-cerip-lime font-semibold text-sm uppercase tracking-wider mb-1">Parcours Savana</p>
            <h1 className="text-2xl md:text-4xl font-bold leading-tight mb-2">De lionceau à Gaindé</h1>
            <p className="text-white/85 text-sm md:text-base mb-4">
              Les contenus sont proposés par ton organisation et tes coachs. Complète les étapes dans l&apos;ordre pour débloquer la suite.
            </p>
            {modulesTotalMois > 0 && (
              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-2.5 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-cerip-lime rounded-full transition-all duration-500" style={{ width: `${(modulesDoneMois / modulesTotalMois) * 100}%` }} />
                </div>
                <span className="text-sm font-bold tabular-nums shrink-0">{modulesDoneMois} / {modulesTotalMois} étapes ce mois</span>
              </div>
            )}
            {mainCtaLabel && (
              <button
                type="button"
                onClick={onMainCtaClick}
                className="w-full md:w-auto min-w-[220px] py-4 px-8 rounded-2xl text-lg font-bold bg-cerip-lime text-cerip-forest hover:bg-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70"
              >
                {mainCtaLabel}
              </button>
            )}
          </div>
          <div className="absolute bottom-0 right-0 w-32 h-32 md:w-40 md:h-40 bg-cerip-lime/10 rounded-full -translate-y-1/2 translate-x-1/2" aria-hidden />
        </section>

        <div className="flex gap-2 border-b border-cerip-forest/10 pb-2">
          <button type="button" onClick={() => setActiveTab('savanna')} className={`px-4 py-2 rounded-lg text-sm font-semibold ${activeTab === 'savanna' ? 'bg-cerip-magenta/20 text-cerip-magenta-dark' : 'text-cerip-forest/80 hover:bg-cerip-forest/10'}`}>SAVANNA</button>
          <button type="button" onClick={() => setActiveTab('theorie')} className={`px-4 py-2 rounded-lg text-sm font-semibold ${activeTab === 'theorie' ? 'bg-cerip-magenta/20 text-cerip-magenta-dark' : 'text-cerip-forest/80 hover:bg-cerip-forest/10'}`}>THÉORIE</button>
          <button type="button" onClick={() => setActiveTab('historique_jdb')} className={`px-4 py-2 rounded-lg text-sm font-semibold ${activeTab === 'historique_jdb' ? 'bg-cerip-lime text-cerip-forest' : 'text-cerip-forest/80 hover:bg-cerip-forest/10'}`}>HISTORIQUE JDB</button>
        </div>

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


        {(activeTab === 'savanna' || activeTab === 'theorie') && (
        <section ref={parcoursSectionRef} className="rounded-2xl bg-white/80 backdrop-blur border border-cerip-forest/10 shadow-sm p-5">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h2 className="text-lg font-bold text-cerip-forest">{activeTab === 'theorie' ? 'Théorie' : 'Parcours à la carte'}</h2>
            <span className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-cerip-forest/15 text-cerip-forest">MOIS {activeMois}</span>
            {profile?.current_parcours && (
              <span className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-cerip-forest/15 text-cerip-forest">
                Phase {profile.current_parcours}
              </span>
            )}
          </div>
          {activeTab === 'theorie' && (
            <p className="text-sm text-cerip-forest/80 mb-2">Contenus théoriques et vidéos du mois pour approfondir.</p>
          )}
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
          ) : (activeTab === 'theorie' ? modulesTheorie : modulesFilteredByMois).length === 0 ? (
            <p className="text-sm text-cerip-forest/70">Aucun module pour le moment pour ce mois.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(activeTab === 'theorie' ? modulesTheorie : modulesFilteredByMois).map((m, index) => {
                const list = activeTab === 'theorie' ? modulesTheorie : modulesFilteredByMois;
                const prog = progress[m.id];
                const done = !!prog?.completed_at;
                const isQuiz = m.type === 'quiz';
                const unlocked = isModuleUnlockedInList(list, m, index);
                const scoreOk = isQuiz && prog?.score_pct != null && Number(prog.score_pct) >= REQUIRED_QUIZ_SCORE_PCT;
                const stepNum = index + 1;
                const stepTotal = list.length;
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
                        ) : (m.payload?.video_url || m.payload?.video_file_path) ? (
                          <button type="button" onClick={() => setContentModule(m)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-cerip-lime text-white hover:bg-cerip-lime-dark transition">Voir la vidéo</button>
                        ) : (
                          <button type="button" onClick={() => markModuleCompleted(m)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-cerip-lime text-white hover:bg-cerip-lime-dark transition">Marquer comme vu</button>
                        )                        ) : m.type === 'text' ? (done ? (
                          <span className="text-xs text-cerip-lime font-medium">Lu</span>
                        ) : (m.payload?.body || m.payload?.document_url || m.payload?.document_file_path) ? (
                          <button type="button" onClick={() => setContentModule(m)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-cerip-lime text-white hover:bg-cerip-lime-dark transition">Lire</button>
                        ) : (
                          <button type="button" onClick={() => markModuleCompleted(m)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-cerip-lime text-white hover:bg-cerip-lime-dark transition">Marquer comme lu</button>
                        )) : m.type === 'document' ? (done ? (
                          <span className="text-xs text-cerip-lime font-medium">Document consulté</span>
                        ) : (m.payload?.document_url || m.payload?.document_file_path) ? (
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
        </section>
        )}

        {activeTab === 'historique_jdb' && (
          <section className="rounded-2xl bg-white/80 backdrop-blur border border-cerip-forest/10 shadow-sm p-5">
            <h2 className="text-lg font-bold text-cerip-forest mb-4">Journal de bord</h2>
            <p className="text-xs text-cerip-forest/70 mb-4">Activités et validations.</p>
            <ul className="space-y-2">
              {[...Array.from(moisValidated)].sort((a, b) => a - b).map((num) => (
                <li key={num} className="flex items-center gap-2 text-sm text-cerip-forest">
                  <span className="font-semibold text-cerip-lime">MOIS {num}</span> validé
                </li>
              ))}
              {Object.entries(progress).filter(([, p]) => p?.completed_at).map(([moduleId, p]) => {
                const mod = modules.find((m) => m.id === moduleId);
                return (
                  <li key={moduleId} className="text-sm text-cerip-forest/90">
                    {mod?.title ?? 'Module'} — {p.score_pct != null ? `${Number(p.score_pct)} %` : 'Complété'} · {new Date(p.completed_at).toLocaleDateString('fr-FR')}
                  </li>
                );
              })}
            </ul>
            {moisValidated.size === 0 && Object.keys(progress).length === 0 && (
              <p className="text-sm text-cerip-forest/70">Aucune activité pour l&apos;instant.</p>
            )}
          </section>
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
                {contentModule.type === 'text' && (contentModule.payload?.document_url || (contentModule.payload?.document_file_path && signedDocumentUrl)) && (
                  <div className="mb-6 h-[60vh] min-h-[300px] rounded-lg border border-cerip-forest/10 overflow-hidden">
                    <iframe title="Document" src={signedDocumentUrl || contentModule.payload.document_url} className="w-full h-full" />
                  </div>
                )}
                {contentModule.type === 'document' && (contentModule.payload?.document_url || (contentModule.payload?.document_file_path && signedDocumentUrl)) && (
                  <div className="mb-6 h-[60vh] min-h-[300px] rounded-lg border border-cerip-forest/10 overflow-hidden">
                    <iframe title="Document" src={signedDocumentUrl || contentModule.payload.document_url} className="w-full h-full" />
                  </div>
                )}
                {contentModule.type === 'video' && (contentModule.payload?.video_url || contentModule.payload?.video_file_path) && (() => {
                  const videoSrc = contentModule.payload?.video_file_path ? signedVideoUrl : contentModule.payload?.video_url;
                  if (!videoSrc) return <p className="mb-6 text-sm text-cerip-forest/70">Chargement de la vidéo…</p>;
                  const embedUrl = getEmbedVideoUrl(videoSrc);
                  return embedUrl ? (
                    <div className="aspect-video mb-6">
                      <iframe title={contentModule.title} src={embedUrl} className="w-full h-full rounded-lg" allowFullScreen />
                    </div>
                  ) : (
                    <div className="mb-6">
                      <video controls className="w-full rounded-lg" src={videoSrc}>
                        Ton navigateur ne supporte pas la lecture. <a href={videoSrc} target="_blank" rel="noopener noreferrer" className="text-cerip-lime underline">Ouvrir le lien</a>
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

        {toolboxOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" aria-modal="true" role="dialog">
            <div className="bg-cerip-forest-mid text-white rounded-2xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-bold text-cerip-lime mb-4">BOÎTE À OUTILS</h3>
              <ul className="space-y-3 mb-6">
                {toolboxDocuments.length === 0 ? (
                  <li className="text-white/80 text-sm">Aucun document pour le moment.</li>
                ) : (
                  toolboxDocuments.map((doc) => {
                    const isStoragePath = doc.file_url && !String(doc.file_url).trim().toLowerCase().startsWith('http');
                    return (
                      <li key={doc.id} className="flex items-center justify-between gap-2">
                        <span className="text-sm">{doc.title}</span>
                        {isStoragePath ? (
                          <button
                            type="button"
                            onClick={async () => {
                              const { data } = await supabase.storage.from('toolbox-documents').createSignedUrl(doc.file_url, 3600);
                              if (data?.signedUrl) window.open(data.signedUrl);
                            }}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-cerip-lime text-cerip-forest hover:bg-white"
                          >
                            Télécharger
                          </button>
                        ) : (
                          <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-lg text-xs font-medium bg-cerip-lime text-cerip-forest hover:bg-white">Télécharger</a>
                        )}
                      </li>
                    );
                  })
                )}
              </ul>
              <button type="button" onClick={() => setToolboxOpen(false)} className="w-full py-3 rounded-xl text-sm font-semibold bg-cerip-magenta text-white hover:opacity-90">
                Fermer
              </button>
            </div>
          </div>
        )}

        {rdvModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" aria-modal="true" role="dialog">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-cerip-forest/10">
              <h3 className="text-lg font-bold text-cerip-forest mb-4">DEMANDE RDV</h3>
              <textarea value={rdvMessage} onChange={(e) => setRdvMessage(e.target.value)} placeholder="Votre message (optionnel)…" className="w-full h-24 px-3 py-2 rounded-lg border border-cerip-forest/20 text-cerip-forest text-sm resize-none mb-4" />
              <div className="flex gap-2">
                <button type="button" onClick={() => { setRdvModalOpen(false); setRdvMessage(''); }} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-cerip-magenta border border-cerip-magenta hover:bg-cerip-magenta-light">Annuler</button>
                <button type="button" disabled={rdvSending} onClick={handleDemanderRdv} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-cerip-lime text-cerip-forest hover:bg-cerip-lime-dark disabled:opacity-70">ENVOYER</button>
              </div>
            </div>
          </div>
        )}

        {messagerieOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" aria-modal="true" role="dialog">
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[80vh] flex flex-col border border-cerip-forest/10">
              <div className="p-4 border-b border-cerip-forest/10">
                <h3 className="text-lg font-bold text-cerip-forest">MESSAGERIE</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-[120px]">
                {messagesList.length === 0 ? (
                  <p className="text-sm text-cerip-forest/70">Aucun message.</p>
                ) : (
                  messagesList.map((msg) => (
                    <div key={msg.id} className={`text-sm p-2 rounded-lg ${msg.from_incube ? 'bg-cerip-lime/15 ml-4' : 'bg-cerip-forest/10 mr-4'}`}>
                      {msg.is_urgence && <span className="text-cerip-magenta font-medium text-xs">SOS </span>}
                      {msg.body}
                      <span className="block text-xs text-cerip-forest/60 mt-1">{new Date(msg.created_at).toLocaleString('fr-FR')}</span>
                    </div>
                  ))
                )}
              </div>
              <div className="p-4 border-t border-cerip-forest/10 flex gap-2">
                <textarea value={newMessageBody} onChange={(e) => setNewMessageBody(e.target.value)} placeholder="Message rapide…" className="flex-1 min-h-[60px] px-3 py-2 rounded-lg border border-cerip-forest/20 text-sm resize-none" />
                <button type="button" disabled={messageSending || !newMessageBody.trim()} onClick={handleSendMessage} className="self-end px-4 py-2 rounded-lg text-sm font-semibold bg-cerip-lime text-cerip-forest hover:bg-cerip-lime-dark disabled:opacity-50">ENVOYER</button>
              </div>
              <button type="button" onClick={() => setMessagerieOpen(false)} className="m-4 mt-0 py-2 rounded-xl text-sm font-medium text-cerip-magenta border border-cerip-magenta hover:bg-cerip-magenta-light">Fermer</button>
            </div>
          </div>
        )}

        {sosUrgenceOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" aria-modal="true" role="dialog">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-cerip-forest/10">
              <h3 className="text-lg font-bold text-cerip-forest mb-4">SOS URGENCE</h3>
              <textarea value={sosUrgenceBody} onChange={(e) => setSosUrgenceBody(e.target.value)} placeholder="Décrivez votre urgence…" className="w-full h-28 px-3 py-2 rounded-lg border border-cerip-forest/20 text-cerip-forest text-sm resize-none mb-4" />
              <div className="flex gap-2">
                <button type="button" onClick={() => { setSosUrgenceOpen(false); setSosUrgenceBody(''); }} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-cerip-magenta border border-cerip-magenta hover:bg-cerip-magenta-light">Annuler</button>
                <button type="button" disabled={sosUrgenceSending || !sosUrgenceBody.trim()} onClick={handleSosUrgence} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-500 text-white hover:bg-red-600 disabled:opacity-70">ENVOYER</button>
              </div>
            </div>
          </div>
        )}

        {sosCoachOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" aria-modal="true" role="dialog">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-cerip-forest/10">
              <h3 className="text-lg font-bold text-cerip-forest mb-4">SOS COACH</h3>
              <p className="text-sm text-cerip-forest/80 mb-4">Demandes de coaching et aide.</p>
              <ul className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                {coachingRequestsHistory.length === 0 ? (
                  <li className="text-sm text-cerip-forest/70">Aucune demande.</li>
                ) : (
                  coachingRequestsHistory.map((r) => (
                    <li key={r.id} className="text-sm p-2 rounded-lg bg-cerip-forest/5">
                      {new Date(r.created_at).toLocaleDateString('fr-FR')} · {r.status === 'PENDING' ? 'En attente' : 'Traité'}
                      {r.message && <span className="block text-cerip-forest/70 mt-0.5">{r.message}</span>}
                    </li>
                  ))
                )}
              </ul>
              {coachId && (
                <>
                  <label className="block text-sm font-medium text-cerip-forest mb-1">Message (optionnel)</label>
                  <textarea
                    value={sosCoachMessage}
                    onChange={(e) => setSosCoachMessage(e.target.value)}
                    placeholder="Précisez votre besoin si vous le souhaitez…"
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-cerip-forest/20 text-cerip-forest text-sm mb-3 resize-none focus:ring-2 focus:ring-cerip-lime focus:border-cerip-forest/30"
                  />
                  <button type="button" disabled={sending} onClick={handleDemanderCoaching} className="w-full py-2.5 rounded-xl text-sm font-semibold bg-cerip-lime text-cerip-forest hover:bg-cerip-lime-dark disabled:opacity-70 mb-2">
                    {sending ? 'Envoi…' : 'Nouvelle demande de session'}
                  </button>
                </>
              )}
              <button type="button" onClick={() => setSosCoachOpen(false)} className="w-full py-2 rounded-xl text-sm font-medium text-cerip-magenta border border-cerip-magenta hover:bg-cerip-magenta-light">Fermer</button>
            </div>
          </div>
        )}

        {mesRdvOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" aria-modal="true" role="dialog">
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-cerip-forest/10 max-h-[85vh] flex flex-col">
              <h3 className="text-lg font-bold text-cerip-forest mb-4">Mes RDV</h3>
              <p className="text-sm text-cerip-forest/70 mb-4">Rendez-vous programmés par ton coach.</p>
              {coachingRequestsHistory.filter((r) => r.request_type === 'RDV').length === 0 ? (
                <p className="text-sm text-cerip-forest/70">Aucun RDV programmé pour le moment.</p>
              ) : (
                <ul className="space-y-4 overflow-y-auto flex-1 min-h-0 pr-1">
                  {coachingRequestsHistory
                    .filter((r) => r.request_type === 'RDV')
                    .map((r) => (
                      <li key={r.id} className="p-4 rounded-xl border border-cerip-forest/10 bg-cerip-forest-light/30 space-y-2">
                        <p className="text-xs font-medium text-cerip-forest/70">
                          {r.scheduled_at
                            ? new Date(r.scheduled_at).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })
                            : new Date(r.created_at).toLocaleDateString('fr-FR', { dateStyle: 'medium' })}
                          {' · '}
                          <span className={r.status === 'PENDING' ? 'text-cerip-magenta' : 'text-cerip-forest/80'}>{r.status === 'PENDING' ? 'À venir' : 'Passé'}</span>
                        </p>
                        {r.objectif && <p className="text-sm text-cerip-forest"><span className="text-cerip-forest/70">Objectif :</span> {r.objectif}</p>}
                        {r.travail_preparatoire && <p className="text-sm text-cerip-forest/80"><span className="text-cerip-forest/70">Travail préparatoire :</span> {r.travail_preparatoire}</p>}
                        {r.platform && <p className="text-xs text-cerip-forest/70">Plateforme : {r.platform}</p>}
                        {r.meeting_link && (
                          <a href={r.meeting_link} target="_blank" rel="noopener noreferrer" className="inline-block mt-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-cerip-lime text-cerip-forest hover:bg-cerip-lime-dark">
                            Rejoindre le RDV
                          </a>
                        )}
                      </li>
                    ))}
                </ul>
              )}
              <button type="button" onClick={() => setMesRdvOpen(false)} className="mt-4 w-full py-2.5 rounded-xl text-sm font-medium text-cerip-magenta border border-cerip-magenta hover:bg-cerip-magenta-light">Fermer</button>
            </div>
          </div>
        )}
      </main>
      </div>
    </div>
  );
}

export default IncubePortal;
