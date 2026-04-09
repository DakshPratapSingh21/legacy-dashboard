'use client';

import { useState } from 'react';
import { ChevronDown, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';
import type { Insight } from '@/lib/types';
import DataTrail from './DataTrail';

interface InsightCardProps {
  insight: Insight;
  index: number;
}

/* Category styles — NO colored left-borders (anti-pattern), using top accent instead */
const categoryConfig = {
  positive: {
    icon: CheckCircle2,
    accentColor: 'var(--positive)',
    accentBg: 'var(--positive-muted)',
    label: 'Working',
  },
  suggestion: {
    icon: AlertTriangle,
    accentColor: 'var(--warning)',
    accentBg: 'var(--warning-muted)',
    label: 'Action needed',
  },
  warning: {
    icon: AlertCircle,
    accentColor: 'var(--critical)',
    accentBg: 'var(--critical-muted)',
    label: 'Urgent',
  },
};

export default function InsightCard({ insight, index }: InsightCardProps) {
  const [expanded, setExpanded] = useState(false);
  const cfg = categoryConfig[insight.category];
  const Icon = cfg.icon;

  return (
    <div
      className="anim-slide rounded-lg overflow-hidden transition-shadow duration-200 hover:shadow-card-hover"
      style={{
        animationDelay: `${index * 60}ms`,
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      {/* Top accent line — 2px, subtle, not garish */}
      <div className="h-[2px]" style={{ background: cfg.accentColor, opacity: 0.5 }} />

      <div className="p-5">
        {/* Click target — min 44px touch area */}
        <button
          className="w-full text-left flex items-start gap-3 min-h-[44px] rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
        >
          {/* Icon */}
          <span
            className="mt-0.5 flex-shrink-0 w-7 h-7 rounded flex items-center justify-center"
            style={{ background: cfg.accentBg }}
          >
            <Icon className="w-3.5 h-3.5" style={{ color: cfg.accentColor }} />
          </span>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Category label */}
            <span
              className="text-[10px] font-semibold uppercase tracking-widest"
              style={{ color: cfg.accentColor, letterSpacing: '0.1em' }}
            >
              {cfg.label}
            </span>

            {/* Headline */}
            <h3
              className="text-sm font-semibold leading-snug mt-1"
              style={{ color: 'var(--text-primary)' }}
            >
              {insight.headline}
            </h3>

            {/* Detail */}
            <p
              className="text-xs leading-relaxed mt-1.5"
              style={{ color: 'var(--text-tertiary)' }}
            >
              {insight.detail}
            </p>
          </div>

          {/* Expand chevron */}
          <ChevronDown
            className="w-4 h-4 mt-1 flex-shrink-0 transition-transform duration-200"
            style={{
              color: 'var(--text-disabled)',
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          />
        </button>

        {/* Suggestion — always visible */}
        <div className="mt-3 ml-10">
          <p className="text-xs font-medium" style={{ color: cfg.accentColor }}>
            {insight.suggestion}
          </p>

          {insight.projectedImpact && (
            <div
              className="mt-2 inline-flex items-center gap-2 text-[10px] px-2 py-1 rounded"
              style={{ background: 'var(--bg-hover)', color: 'var(--text-tertiary)' }}
            >
              <span>
                {insight.projectedImpact.metric}:{' '}
                {insight.projectedImpact.currentValue < 1
                  ? `${(insight.projectedImpact.currentValue * 100).toFixed(1)}%`
                  : insight.projectedImpact.currentValue.toFixed(1)}
                {' → '}
                {insight.projectedImpact.projectedValue < 1
                  ? `${(insight.projectedImpact.projectedValue * 100).toFixed(1)}%`
                  : insight.projectedImpact.projectedValue.toFixed(1)}
              </span>
              <span
                className="font-semibold"
                style={{
                  color: insight.projectedImpact.confidence === 'high'
                    ? 'var(--positive)'
                    : insight.projectedImpact.confidence === 'medium'
                    ? 'var(--warning)'
                    : 'var(--text-disabled)',
                }}
              >
                {insight.projectedImpact.confidence}
              </span>
            </div>
          )}
        </div>

        {/* Expandable data trail */}
        {expanded && (
          <div className="ml-10 anim-fade">
            <DataTrail points={insight.dataTrail} sourceTable={insight.sourceTable} />
          </div>
        )}
      </div>
    </div>
  );
}
