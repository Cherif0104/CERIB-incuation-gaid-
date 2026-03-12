import React from 'react';

function IncubeHero({
  profile,
  modulesDoneMois,
  modulesTotalMois,
  mainCtaLabel,
  onMainCtaClick,
  canStartExam,
  examStarting,
  onStartExam,
  nextModule,
}) {
  const prenom = profile?.full_name?.trim() ? (profile.full_name.split(/\s+/)[0] || profile.full_name) : null;
  const subtitle = nextModule
    ? `Prochaine étape : ${nextModule.title}`
    : modulesDoneMois > 0 && modulesTotalMois > 0
      ? 'Tu as terminé les modules de cette étape.'
      : 'Complète les étapes dans l\'ordre pour débloquer la suite.';

  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-cerip-forest/90 via-cerip-forest-mid to-cerip-forest text-white p-6 md:p-8 shadow-xl border border-cerip-forest/20">
      <div className="relative z-10">
        <h1 className="text-2xl md:text-4xl font-bold leading-tight mb-2">
          {prenom ? `Bonjour, ${prenom}` : 'De lionceau à Gaindé'}
        </h1>
        <p className="text-white/85 text-sm md:text-base mb-4">{subtitle}</p>
        {modulesTotalMois > 0 && (
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-2.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-cerip-lime rounded-full transition-all duration-500"
                style={{ width: `${(modulesDoneMois / modulesTotalMois) * 100}%` }}
              />
            </div>
            <span className="text-sm font-bold tabular-nums shrink-0">
              {modulesDoneMois} / {modulesTotalMois} à cette étape
            </span>
          </div>
        )}
        <div className="flex flex-wrap gap-3 items-center">
          {mainCtaLabel && (
            <button
              type="button"
              onClick={onMainCtaClick}
              className="w-full md:w-auto min-w-[200px] py-4 px-8 rounded-2xl text-lg font-bold bg-cerip-lime text-cerip-forest hover:bg-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70"
            >
              {mainCtaLabel}
            </button>
          )}
          {canStartExam && (
            <button
              type="button"
              onClick={onStartExam}
              disabled={examStarting}
              className="w-full md:w-auto min-w-[180px] py-4 px-8 rounded-2xl text-lg font-bold bg-cerip-magenta text-white hover:bg-cerip-magenta-dark shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70"
            >
              {examStarting ? 'Lancement…' : 'Lancer l\'examen'}
            </button>
          )}
        </div>
      </div>
      <div className="absolute bottom-0 right-0 w-32 h-32 md:w-40 md:h-40 bg-cerip-lime/10 rounded-full -translate-y-1/2 translate-x-1/2" aria-hidden />
    </section>
  );
}

export default IncubeHero;
