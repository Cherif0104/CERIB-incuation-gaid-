import React from 'react';

function IncubeModuleCard({ module, progress, unlocked, requiredScore, onOpen, onMarkCompleted }) {
  const prog = progress[module?.id];
  const done = !!prog?.completed_at;
  const isQuiz = module?.type === 'quiz';

  const renderAction = () => {
    if (!unlocked) {
      return <span className="inline-block px-3 py-1.5 rounded-lg text-xs font-medium bg-cerip-forest/10 text-cerip-forest/70">Verrouillé</span>;
    }
    if (module?.type === 'quiz') {
      return (
        <button type="button" onClick={() => onOpen(module)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-cerip-lime text-white hover:bg-cerip-lime-dark transition">
          {done ? 'Revoir le quiz' : 'Passer le quiz'}
        </button>
      );
    }
    if (module?.type === 'video') {
      if (done) return <span className="text-xs text-cerip-lime font-medium">Marqué comme vu</span>;
      if (module.payload?.video_url || module.payload?.video_file_path) {
        return (
          <button type="button" onClick={() => onOpen(module)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-cerip-lime text-white hover:bg-cerip-lime-dark transition">
            Voir la vidéo
          </button>
        );
      }
      return (
        <button type="button" onClick={() => onMarkCompleted(module)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-cerip-lime text-white hover:bg-cerip-lime-dark transition">
          Marquer comme vu
        </button>
      );
    }
    if (module?.type === 'text') {
      if (done) return <span className="text-xs text-cerip-lime font-medium">Lu</span>;
      if (module.payload?.body || module.payload?.document_url || module.payload?.document_file_path) {
        return (
          <button type="button" onClick={() => onOpen(module)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-cerip-lime text-white hover:bg-cerip-lime-dark transition">
            Lire
          </button>
        );
      }
      return (
        <button type="button" onClick={() => onMarkCompleted(module)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-cerip-lime text-white hover:bg-cerip-lime-dark transition">
          Marquer comme lu
        </button>
      );
    }
    if (module?.type === 'document') {
      if (done) return <span className="text-xs text-cerip-lime font-medium">Document consulté</span>;
      if (module.payload?.document_url || module.payload?.document_file_path) {
        return (
          <button type="button" onClick={() => onOpen(module)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-cerip-lime text-white hover:bg-cerip-lime-dark transition">
            Ouvrir le document
          </button>
        );
      }
      return (
        <button type="button" onClick={() => onMarkCompleted(module)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-cerip-lime text-white hover:bg-cerip-lime-dark transition">
          Marquer comme vu
        </button>
      );
    }
    return (
      <button type="button" onClick={() => onMarkCompleted(module)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-cerip-lime text-white hover:bg-cerip-lime-dark transition">
        Marquer comme vu
      </button>
    );
  };

  const typeIcon = () => {
    if (module?.type === 'quiz') return <span className="w-10 h-10 rounded-full bg-cerip-lime/20 flex items-center justify-center text-cerip-lime" aria-hidden>?</span>;
    if (module?.type === 'text') return <span className="w-10 h-10 rounded-full bg-cerip-forest/20 flex items-center justify-center text-cerip-forest" aria-hidden>📄</span>;
    if (module?.type === 'video') return <span className="w-10 h-10 rounded-full bg-cerip-magenta/20 flex items-center justify-center text-cerip-magenta" aria-hidden>▶</span>;
    return <span className="w-10 h-10 rounded-full bg-cerip-forest/20 flex items-center justify-center text-cerip-forest" aria-hidden>📎</span>;
  };

  return (
    <div
      className={`rounded-2xl border overflow-hidden transition-all duration-200 ${
        !unlocked
          ? 'border-cerip-forest/10 bg-cerip-forest/5 opacity-75'
          : done
            ? 'border-cerip-lime/30 bg-cerip-lime/5'
            : 'border-cerip-forest/15 bg-white hover:shadow-md hover:border-cerip-forest/20'
      }`}
    >
      <div className="flex gap-4 p-4">
        <div className="shrink-0">{typeIcon()}</div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-cerip-forest text-sm">{module?.title}</p>
          {module?.description && <p className="text-xs text-cerip-forest/70 mt-0.5 line-clamp-2">{module.description}</p>}
          {done && (
            <p className="text-xs font-medium mt-2 text-cerip-lime">
              {prog?.score_pct != null ? `Complété · ${Number(prog.score_pct)} %` : 'Complété'}
              {isQuiz && prog?.score_pct != null && (Number(prog.score_pct) >= requiredScore ? ' · Étape suivante débloquée' : ' · Rejouer pour débloquer')}
            </p>
          )}
          {!unlocked && (
            <p className="text-xs text-cerip-forest/70 mt-2">Complétez le module précédent (quiz : note ≥ {requiredScore} %).</p>
          )}
          <div className="mt-3">{renderAction()}</div>
        </div>
      </div>
    </div>
  );
}

export default IncubeModuleCard;
