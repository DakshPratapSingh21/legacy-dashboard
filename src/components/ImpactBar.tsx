'use client';

interface ImpactBarProps {
  currentValue: number;
  projectedValue: number;
  conservativeValue: number;
  metric: string;
}

export default function ImpactBar({
  currentValue,
  projectedValue,
  conservativeValue,
  metric,
}: ImpactBarProps) {
  const max = Math.max(projectedValue, currentValue) * 1.25;
  const currentPct = max > 0 ? (currentValue / max) * 100 : 0;
  const conservativePct = max > 0 ? (conservativeValue / max) * 100 : 0;
  const projectedPct = max > 0 ? (projectedValue / max) * 100 : 0;

  const fmt = (v: number): string => {
    if (v < 1 && v > 0) return `${(v * 100).toFixed(1)}%`;
    return v.toFixed(1);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[10px]">
        <span style={{ color: 'var(--text-disabled)' }}>{metric}</span>
        <span style={{ color: 'var(--text-tertiary)' }}>
          {fmt(currentValue)} → {fmt(conservativeValue)}
        </span>
      </div>

      {/* Bar track */}
      <div
        className="relative h-5 rounded overflow-hidden"
        style={{ background: 'var(--bg-hover)' }}
      >
        {/* Current value */}
        <div
          className="absolute inset-y-0 left-0 rounded"
          style={{
            width: `${currentPct}%`,
            background: 'var(--border-default)',
          }}
        />
        {/* Conservative projection */}
        <div
          className="absolute inset-y-0 left-0 rounded"
          style={{
            width: `${conservativePct}%`,
            background: 'oklch(68% 0.16 155 / 0.25)',
          }}
        />
        {/* Optimistic line */}
        <div
          className="absolute inset-y-0"
          style={{
            left: `${projectedPct}%`,
            width: '1px',
            background: 'var(--positive)',
            opacity: 0.5,
          }}
        />
        {/* Value label */}
        <div className="absolute inset-0 flex items-center px-2">
          <span className="text-[10px] font-semibold" style={{ color: 'var(--text-secondary)' }}>
            {fmt(currentValue)}
          </span>
        </div>
      </div>
    </div>
  );
}
