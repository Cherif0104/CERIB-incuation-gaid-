import React from 'react';

function IncubeSidebar({
  profile,
  activeMois,
  moisList,
  moisValidated,
  promotionNames,
  onMoisChange,
  onToolboxOpen,
  onCoachOpen,
  onClose,
  sidebarOpen,
  pendingCoachingCount,
  rdvCount,
}) {
  const prenom = profile?.full_name?.trim() ? (profile.full_name.split(/\s+/)[0] || profile.full_name) : (profile?.email ?? 'Étudiant');

  const isMoisUnlocked = (moisNum) => {
    const idx = moisList.indexOf(moisNum);
    if (idx <= 0) return true;
    return moisValidated.has(moisList[idx - 1]);
  };

  return (
    <>
      {sidebarOpen && (
        <button type="button" onClick={onClose} className="fixed inset-0 z-30 bg-black/50 md:hidden" aria-label="Fermer le menu" />
      )}
      <aside
        className={`fixed md:relative inset-y-0 left-0 z-40 w-64 md:w-52 shrink-0 bg-cerip-forest/95 text-white flex flex-col p-3 gap-2 transform transition-transform duration-200 ease-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between md:block">
          <p className="text-cerip-lime font-semibold text-xs uppercase tracking-wider px-2">Savana</p>
          <button type="button" onClick={onClose} className="md:hidden p-2 rounded-lg text-white hover:bg-white/10" aria-label="Fermer le menu">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="text-white font-medium text-sm px-2">Bonjour, {prenom}</p>

        {promotionNames?.length > 0 && (
          <p className="text-cerip-lime/90 text-xs px-2 mt-1">Ma cohorte : {promotionNames[0]}{promotionNames.length > 1 ? ` (+${promotionNames.length - 1})` : ''}</p>
        )}

        <div className="mt-2">
          <p className="text-white/70 text-xs px-2 mb-1 uppercase tracking-wider">Mon parcours</p>
          <div className="space-y-1">
            {moisList.map((num) => {
              const unlocked = isMoisUnlocked(num);
              return (
                <button
                  key={num}
                  type="button"
                  onClick={() => {
                    if (unlocked) {
                      onMoisChange(num);
                      onClose();
                    }
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-between ${
                    activeMois === num ? 'bg-cerip-lime text-cerip-forest' : unlocked ? 'hover:bg-white/10 text-white' : 'text-white/50 cursor-not-allowed'
                  }`}
                >
                  Étape {num}
                  {!unlocked && <span className="text-xs" aria-hidden>🔒</span>}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-white/20 space-y-1">
          <p className="text-white/70 text-xs px-2 mb-1 uppercase tracking-wider">Accompagnement</p>
          <button
            type="button"
            onClick={() => { onCoachOpen(); onClose(); }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-white hover:bg-white/10 flex items-center justify-between"
          >
            <span>Mon coach</span>
            {pendingCoachingCount > 0 && (
              <span className="bg-cerip-magenta text-white text-xs font-bold rounded-full min-w-[1.25rem] h-5 flex items-center justify-center px-1">
                {pendingCoachingCount}
              </span>
            )}
          </button>
        </div>

        <div className="mt-2 pt-2 border-t border-white/20">
          <p className="text-white/70 text-xs px-2 mb-1 uppercase tracking-wider">Ressources</p>
          <button
            type="button"
            onClick={() => { onToolboxOpen(); onClose(); }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-white hover:bg-white/10"
          >
            Boîte à outils
          </button>
        </div>
      </aside>
    </>
  );
}

export default IncubeSidebar;
