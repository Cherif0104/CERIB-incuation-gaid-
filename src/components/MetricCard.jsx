import React from 'react';

/**
 * Carte KPI réutilisable — valeur en avant, sous-texte optionnel, style charte CERIP.
 * @param {string} label - Titre du KPI
 * @param {React.ReactNode} value - Valeur (nombre, badge, etc.)
 * @param {string} [subText] - Sous-texte ou tendance
 * @param {React.ReactNode} [icon] - Icône optionnelle
 * @param {string} [className] - Classes additionnelles
 * @param {number} [animationDelay] - Délai en ms pour apparition stagger
 */
function MetricCard({ label, value, subText, icon, className = '', animationDelay = 0 }) {
  return (
    <div
      className={`
        bg-white rounded-2xl shadow-sm border border-cerip-forest/10 p-5
        hover:shadow-md hover:border-cerip-forest/15 hover:-translate-y-0.5
        transition-all duration-300 ease-out
        dashboard-card
        ${className}
      `}
      style={animationDelay ? { animationDelay: `${animationDelay}ms` } : undefined}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-cerip-forest/70 mb-1">
            {label}
          </p>
          <p className="text-2xl md:text-3xl font-bold text-cerip-forest tabular-nums truncate">
            {value}
          </p>
          {subText && (
            <p className="text-xs text-cerip-forest/60 mt-1 truncate">{subText}</p>
          )}
        </div>
        {icon && (
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-cerip-forest/5 flex items-center justify-center text-cerip-forest/70">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

export default MetricCard;
