'use client';

import type { SuggestionItem } from '@/lib/types';
import SuggestionCard from './SuggestionCard';

interface SuggestionBoardProps {
  suggestions: SuggestionItem[];
}

export default function SuggestionBoard({ suggestions }: SuggestionBoardProps) {
  if (suggestions.length === 0) return null;

  return (
    <section className="anim-fade">
      <div className="mb-5">
        <h2
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: 'var(--text-disabled)', letterSpacing: '0.1em' }}
        >
          Suggestions
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
          IF/THEN recommendations grounded in benchmark evidence
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {suggestions.map((suggestion, i) => (
          <SuggestionCard key={suggestion.id} suggestion={suggestion} index={i} />
        ))}
      </div>
    </section>
  );
}
