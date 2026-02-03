import React from 'react';

const DEFAULT_SIZE = 80;
const DEFAULT_STROKE = 8;

/**
 * Jauge circulaire (anneau) — pour score 0–100 %.
 * Couleur : lime si value >= 70 %, sinon magenta (en cours).
 */
function ProgressRing({ value = 0, size = DEFAULT_SIZE, stroke = DEFAULT_STROKE, label = '' }) {
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, Number(value)));
  const dash = (pct / 100) * circumference;
  const isSuccess = pct >= 70;
  const color = isSuccess ? 'var(--color-cerip-lime)' : 'var(--color-cerip-magenta)';

  return (
    <div className="inline-flex flex-col items-center">
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
        aria-hidden
      >
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-cerip-forest/10"
        />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - dash}
          className="transition-all duration-700 ease-out progress-ring-stroke"
        />
      </svg>
      <span className="text-lg font-bold text-cerip-forest mt-1 tabular-nums">
        {label || `${Math.round(pct)} %`}
      </span>
    </div>
  );
}

export default ProgressRing;
