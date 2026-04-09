'use client';

import { useState } from 'react';
import { ChevronDown, Zap } from 'lucide-react';
import type { SuggestionItem } from '@/lib/types';
import ImpactBar from './ImpactBar';

interface SuggestionCardProps {
  suggestion: SuggestionItem;
  index: number;
}

const confidenceStyles = {
  high: { color: 'var(--positive)', bg: 'var(--positive-muted)' },
  medium: { color: 'var(--warning)', bg: 'var(--warning-muted)' },
  low: { color: 'var(--text-disabled)', bg: 'var(--bg-hover)' },
};

export default function SuggestionCard({ suggestion, index }: SuggestionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const cStyle = confidenceStyles[suggestion.confidence];

  return (
    <div
      className="anim-slide rounded-lg overflow-hidden transition-shadow duration-200 hover:shadow-card-hover"
      style={{
        animationDelay: `${index * 80}ms`,
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      {/* Top accent — accent color */}
      <div className="h-[2px]" style={{ background: 'var(--border-strong)', opacity: 0.5 }} />

      <div className="p-5">
        <button
          className="w-full text-left flex items-start gap-3 min-h-[44px] rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
        >
          <span
            className="mt-0.5 flex-shrink-0 w-7 h-7 rounded flex items-center justify-center"
            style={{ background: 'var(--accent-muted)' }}
          >
            <Zap className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
          </span>

          <div className="flex-1 min-w-0">
            {/* IF label + confidence badge */}
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: 'var(--text-tertiary)', letterSpacing: '0.1em' }}
              >
                IF
              </span>
              <span
                className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                style={{ color: cStyle.color, background: cStyle.bg }}
              >
                {suggestion.confidence}
              </span>
            </div>

            <p className="text-sm font-medium leading-snug" style={{ color: 'var(--text-primary)' }}>
              {suggestion.ifCondition}
            </p>

            {/* THEN */}
            <div className="mt-2.5">
              <span
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: 'var(--positive)', letterSpacing: '0.1em' }}
              >
                THEN
              </span>
              <p className="text-sm leading-snug mt-0.5" style={{ color: 'var(--positive)' }}>
                {suggestion.thenImpact}
              </p>
            </div>
          </div>

          <ChevronDown
            className="w-4 h-4 mt-1 flex-shrink-0 transition-transform duration-200"
            style={{
              color: 'var(--text-disabled)',
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          />
        </button>

        {/* Impact bar — always visible */}
        <div className="mt-4 ml-10">
          <ImpactBar
            currentValue={suggestion.currentValue}
            projectedValue={suggestion.projectedValue}
            conservativeValue={suggestion.conservativeValue}
            metric={suggestion.metric}
          />
        </div>

        {/* Expanded basis */}
        {expanded && (
          <div
            className="mt-4 ml-10 pt-3 anim-fade"
            style={{ borderTop: '1px solid var(--border-subtle)' }}
          >
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-disabled)' }}>
              <span className="font-medium" style={{ color: 'var(--text-tertiary)' }}>Based on: </span>
              {suggestion.basedOn}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
