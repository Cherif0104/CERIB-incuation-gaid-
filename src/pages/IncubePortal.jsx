import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabaseClient';
import { getNiveauBadge } from '../components/incube/incubeUtils';
import IncubeHero from '../components/incube/IncubeHero';
import IncubeModuleCard from '../components/incube/IncubeModuleCard';

function IncubePortal() {
  const navigate = useNavigate();
  const outletContext = useOutletContext();
  const {
    profile,
    onRefreshProfile,
    onLogout,
    coachName,
    moisValidated,
    modules,
    progress,
    loading: modulesLoading,
    loadError,
    moisList,
    nextModule,
    REQUIRED_QUIZ_SCORE_PCT,
    isModuleUnlocked,
    markCompleted,
    retryLoad,
    canStartExam,
    demanderCoaching,
    demanderRdv,
    sendMessage,
    sendSosUrgence,
  } = outletContext || {};

  const activeMois = outletContext?.activeMois ?? 1;
  const setActiveMois = outletContext?.setActiveMois;
  const [historiqueOpen, setHistoriqueOpen] = useState(false);
  const [requestError, setRequestError] = useState(null);
  const [examStarting, setExamStarting] = useState(false);
  const parcoursSectionRef = useRef(null);

  useEffect(() => {
    if (moisList?.length > 0 && !moisList.includes(activeMois) && setActiveMois) {
      setActiveMois(moisList[0]);
    }
  }, [moisList, activeMois, setActiveMois]);

  const modulesFilteredByMois = (modules ?? []).filter((m) => m.mois == null || m.mois === activeMois);
  const modulesTotalMois = modulesFilteredByMois.length;
  const modulesDoneMois = modulesFilteredByMois.filter((m) => progress?.[m.id]?.completed_at).length;

  const mainCtaLabel = nextModule ? 'Continuer' : (modules?.length ?? 0) > 0 ? (modulesDoneMois > 0 ? 'Continuer' : 'Démarrer') : null;

  const openModuleAction = (module) => {
    if (!module) return;
    if (module.type === 'quiz') {
      navigate(`/incube/module/${module.id}`);
      return;
    }
    if ((module.type === 'text' || module.type === 'document') && (module.payload?.body || module.payload?.document_url || module.payload?.document_file_path)) {
      navigate(`/incube/module/${module.id}`);
      return;
    }
    if (module.type === 'video' && (module.payload?.video_url || module.payload?.video_file_path)) {
      navigate(`/incube/module/${module.id}`);
      return;
    }
    markCompleted?.(module).then(() => {
      parcoursSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const onMainCtaClick = () => {
    if (nextModule) {
      openModuleAction(nextModule);
      setTimeout(() => parcoursSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } else if (modules?.length > 0) {
      openModuleAction(modules[0]);
      setTimeout(() => parcoursSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } else if (parcoursSectionRef.current) {
      parcoursSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleStartExam = async () => {
    if (!outletContext?.canStartExam || examStarting) return;
    setExamStarting(true);
    setRequestError(null);
    const { data: d, error } = await supabase.rpc('start_certification_exam');
    setExamStarting(false);
    if (error) {
      setRequestError(error.message);
      toast.error(error.message);
      return;
    }
    if (d?.ok) {
      onRefreshProfile?.();
      navigate('/incube/exam');
    } else {
      const msg = d?.error || 'Impossible de lancer l\'examen';
      setRequestError(msg);
      toast.error(msg);
    }
  };

  if (!profile) {
    return (
      <div className="flex min-h-[200px] items-center justify-center p-6">
        <p className="text-cerip-forest/80">Chargement…</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      {loadError && (
        <div className="rounded-xl bg-cerip-magenta-light border border-cerip-magenta/30 text-cerip-magenta-dark text-sm px-4 py-3 flex flex-wrap items-center justify-between gap-2">
          <span>{loadError.scope} : {loadError.message}</span>
          <button type="button" onClick={() => retryLoad(loadError.scope)} className="px-3 py-1.5 rounded-lg font-medium bg-cerip-magenta/20 hover:bg-cerip-magenta/30">
            Réessayer
          </button>
        </div>
      )}

      <IncubeHero
        profile={profile}
        modulesDoneMois={modulesDoneMois}
        modulesTotalMois={modulesTotalMois}
        mainCtaLabel={mainCtaLabel}
        onMainCtaClick={onMainCtaClick}
        canStartExam={canStartExam}
        examStarting={examStarting}
        onStartExam={handleStartExam}
        nextModule={nextModule}
      />

      {requestError && (
        <div className="rounded-xl bg-cerip-magenta-light border border-cerip-magenta/30 text-cerip-magenta-dark text-sm px-4 py-3">
          {requestError}
        </div>
      )}

      <section ref={parcoursSectionRef} className="rounded-2xl bg-white/80 backdrop-blur border border-cerip-forest/10 shadow-sm p-5">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
          <h2 className="text-lg font-bold text-cerip-forest">Mon parcours</h2>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-cerip-forest/15 text-cerip-forest">Étape {activeMois}</span>
            {profile?.current_parcours && (
              <span className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-cerip-forest/15 text-cerip-forest">Phase {profile.current_parcours}</span>
            )}
          </div>
        </div>
        <p className="text-xs text-cerip-forest/70 mb-4">
          Quiz : note ≥ {REQUIRED_QUIZ_SCORE_PCT} % pour débloquer l&apos;étape suivante.
          {coachName && <span className="ml-1">Ton coach : {coachName}.</span>}
        </p>

        {modulesLoading ? (
          <p className="text-sm text-cerip-forest/70">Chargement des modules…</p>
        ) : !profile?.current_parcours ? (
          <p className="text-sm text-cerip-forest/70">Ton parcours n&apos;est pas encore assigné. Contacte ton organisation.</p>
        ) : modulesFilteredByMois.length === 0 ? (
          <p className="text-sm text-cerip-forest/70">Aucun module pour le moment pour cette étape.</p>
        ) : (
          <div className="space-y-3">
            {modulesFilteredByMois.map((m, index) => (
              <IncubeModuleCard
                key={m.id}
                module={m}
                progress={progress ?? {}}
                unlocked={isModuleUnlocked?.(modulesFilteredByMois, m, index) ?? false}
                requiredScore={REQUIRED_QUIZ_SCORE_PCT}
                onOpen={openModuleAction}
                onMarkCompleted={(mod) => markCompleted?.(mod).then(() => parcoursSectionRef.current?.scrollIntoView({ behavior: 'smooth' }))}
              />
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => setHistoriqueOpen((o) => !o)}
          className="mt-6 text-sm font-medium text-cerip-forest/80 hover:text-cerip-forest"
        >
          {historiqueOpen ? 'Masquer' : 'Voir'} mon historique
        </button>
        {historiqueOpen && (
          <div className="mt-4 p-4 rounded-xl bg-cerip-forest-light/50 border border-cerip-forest/10">
            <h3 className="text-sm font-semibold text-cerip-forest mb-2">Mon journal</h3>
            <ul className="space-y-2 text-sm text-cerip-forest/90">
              {[...Array.from(moisValidated ?? [])].sort((a, b) => a - b).map((num) => (
                <li key={num}><span className="font-semibold text-cerip-lime">Étape {num}</span> validée</li>
              ))}
              {Object.entries(progress ?? {}).filter(([, p]) => p?.completed_at).map(([moduleId, p]) => {
                const mod = (modules ?? []).find((m) => m.id === moduleId);
                return (
                  <li key={moduleId}>
                    {mod?.title ?? 'Module'} — {p.score_pct != null ? `${Number(p.score_pct)} %` : 'Complété'} · {new Date(p.completed_at).toLocaleDateString('fr-FR')}
                  </li>
                );
              })}
            </ul>
            {(!moisValidated?.size && Object.keys(progress ?? {}).length === 0) && (
              <p className="text-sm text-cerip-forest/70">Aucune activité pour l&apos;instant.</p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

export default IncubePortal;
