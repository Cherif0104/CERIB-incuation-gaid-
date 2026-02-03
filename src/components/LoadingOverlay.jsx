import React from 'react';

/**
 * Overlay de chargement — style premium, gamifié, inspiré Parcours Grand Lion.
 * Lion en forme ronde avec halo, fond sombre, transition propre.
 */
function LoadingOverlay({ message = 'Chargement…', subMessage, exiting = false }) {
  return (
    <div
      className={`
        overlay-root fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden
        transition-opacity duration-200 ease-out
        ${exiting ? 'opacity-0 pointer-events-none' : 'opacity-100'}
      `}
      style={{
        background: 'linear-gradient(165deg, #0a1612 0%, #0f1f18 30%, #142a1f 60%, #0d1210 100%)',
      }}
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      {/* Motif discret : points / grille */}
      <div className="overlay-pattern absolute inset-0 pointer-events-none" aria-hidden />

      <div className="relative z-10 flex flex-col items-center justify-center flex-1 w-full max-w-md px-6 py-8">
        {/* Badge parcours */}
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cerip-forest/30 border border-cerip-lime/30 text-cerip-lime text-xs font-semibold uppercase tracking-wider mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-cerip-lime animate-pulse" aria-hidden />
          Parcours Grand Lion
        </span>

        {/* Lion en forme ronde + halo */}
        <div className="overlay-lion-ring relative mb-6">
          <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-full overflow-hidden bg-cerip-forest/20 ring-4 ring-cerip-lime/40 ring-offset-4 ring-offset-transparent shadow-[0_0_32px_rgba(138,196,75,0.25)]">
            <img
              src="/lion-gainde.webp"
              alt=""
              className="w-full h-full object-cover object-center"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/logo-cerip-senegal.png';
                e.target.className = 'w-full h-full object-contain object-center p-4';
              }}
            />
          </div>
        </div>

        {/* Parcours : Lionceau → Accompagnement → Gaindé */}
        <p className="text-cerip-forest-light/70 text-sm font-medium tracking-wide mb-4">
          Lionceau → Accompagnement → Gaindé
        </p>

        {/* Slogan */}
        <p className="text-white font-bold text-lg sm:text-xl tracking-tight mb-1">
          Explore la savane
        </p>
        <p className="text-cerip-lime/90 text-sm font-medium mb-8">
          De lionceau à Gaindé — Évolution gamifiée
        </p>

        {/* Message de chargement + 3 points */}
        <div className="flex items-center justify-center gap-2">
          <p className="text-cerip-forest-light/90 text-sm font-medium">
            {message}
          </p>
          <span className="flex gap-1" aria-hidden>
            <span className="w-1.5 h-1.5 rounded-full bg-cerip-lime overlay-dot" />
            <span className="w-1.5 h-1.5 rounded-full bg-cerip-lime overlay-dot overlay-dot-2" />
            <span className="w-1.5 h-1.5 rounded-full bg-cerip-lime overlay-dot overlay-dot-3" />
          </span>
        </div>
        {subMessage && (
          <p className="text-cerip-forest-light/60 text-xs mt-2">{subMessage}</p>
        )}
      </div>

      {/* Trois points en bas (style pagination) */}
      <div className="relative z-10 flex gap-1.5 pb-8" aria-hidden>
        <span className="w-2 h-2 rounded-full bg-cerip-lime/80 overlay-dot" />
        <span className="w-2 h-2 rounded-full bg-cerip-lime/50 overlay-dot overlay-dot-2" />
        <span className="w-2 h-2 rounded-full bg-cerip-lime/30 overlay-dot overlay-dot-3" />
      </div>
    </div>
  );
}

export default LoadingOverlay;
