'use client';

import { Info } from 'lucide-react';
import { useState } from 'react';

interface MetricCardData {
  label: string;
  legacyValue: string | number | null; // null = TBU
  broadwayValue: string | number;
  landmarkValue: string | number;
  tooltip: string;
  format?: 'number' | 'rate' | 'ratio';
}

interface ExecutiveHealthCardsProps {
  metrics: MetricCardData[];
  mode: 'demo' | 'live';
}

function formatValue(value: string | number, format?: string): string {
  if (typeof value === 'string') return value;
  if (format === 'rate') return `${(value * 100).toFixed(1)}%`;
  if (format === 'ratio') return value.toFixed(2);
  return value.toLocaleString();
}

function MetricCard({ card, mode }: { card: MetricCardData; mode: string }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const isLegacyAvailable = mode === 'live' && card.legacyValue !== null;

  return (
    <div
      className="relative rounded-lg p-5 transition-shadow duration-200"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* Label row with info button */}
      <div className="flex items-center justify-between mb-4">
        <span
          className="text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: 'var(--text-disabled)', letterSpacing: '0.1em' }}
        >
          {card.label}
        </span>
        <button
          className="relative w-5 h-5 flex items-center justify-center rounded-full min-h-[44px] min-w-[44px] -m-3"
          style={{ color: 'var(--text-disabled)' }}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          onFocus={() => setShowTooltip(true)}
          onBlur={() => setShowTooltip(false)}
          aria-label={card.tooltip}
        >
          <Info className="w-3.5 h-3.5" />
          {showTooltip && (
            <div
              className="absolute bottom-full right-0 mb-2 w-52 p-2.5 rounded-md text-[10px] leading-relaxed z-50 anim-fade"
              style={{
                background: 'var(--tooltip-bg)',
                color: 'var(--tooltip-text)',
                border: '1px solid var(--tooltip-border)',
                boxShadow: 'var(--shadow-lg)',
              }}
            >
              {card.tooltip}
            </div>
          )}
        </button>
      </div>

      {/* Legacy value — large, or TBU placeholder */}
      {isLegacyAvailable ? (
        <div className="mb-4">
          <span className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {formatValue(card.legacyValue!, card.format)}
          </span>
          <span className="text-[10px] ml-1.5" style={{ color: 'var(--text-disabled)' }}>Legacy</span>
        </div>
      ) : (
        <div className="mb-4">
          <span
            className="text-2xl font-bold"
            style={{ color: 'var(--text-disabled)' }}
          >
            TBU
          </span>
          <span className="text-[10px] ml-1.5" style={{ color: 'var(--text-disabled)' }}>Legacy (awaiting data)</span>
        </div>
      )}

      {/* Benchmark comparison row */}
      <div className="flex items-end gap-6">
        <div>
          <span className="text-[10px] block mb-0.5" style={{ color: 'var(--text-disabled)' }}>Broadway</span>
          <span className="text-lg font-semibold" style={{ color: 'var(--chart-broadway)' }}>
            {formatValue(card.broadwayValue, card.format)}
          </span>
        </div>
        <div>
          <span className="text-[10px] block mb-0.5" style={{ color: 'var(--text-disabled)' }}>Landmark</span>
          <span className="text-lg font-semibold" style={{ color: 'var(--chart-landmark)' }}>
            {formatValue(card.landmarkValue, card.format)}
          </span>
        </div>
      </div>
    </div>
  );
}

export type { MetricCardData };

export default function ExecutiveHealthCards({ metrics, mode }: ExecutiveHealthCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((card, i) => (
        <MetricCard key={i} card={card} mode={mode} />
      ))}
    </div>
  );
}
