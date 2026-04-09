'use client';

import type { DataPoint } from '@/lib/types';

interface DataTrailProps {
  points: DataPoint[];
  sourceTable: string;
}

const SOURCE_LABELS: Record<string, string> = {
  T1: 'Calling Data',
  T3: 'Lead Scoring',
  T5: 'Visit Tracking',
  T7: 'Campaign Progress',
};

export default function DataTrail({ points, sourceTable }: DataTrailProps) {
  const friendlySource = SOURCE_LABELS[sourceTable] || sourceTable;
  return (
    <div
      className="mt-4 pt-4"
      style={{ borderTop: '1px solid var(--border-subtle)' }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span
          className="text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: 'var(--text-disabled)', letterSpacing: '0.12em' }}
        >
          Data trail
        </span>
        <span
          className="text-[10px] font-mono px-1.5 py-0.5 rounded"
          style={{
            color: 'var(--text-disabled)',
            background: 'var(--bg-hover)',
          }}
        >
          {friendlySource}
        </span>
      </div>

      <div className="space-y-2.5">
        {points.map((point, i) => (
          <div key={i} className="flex items-baseline gap-3 text-xs leading-relaxed">
            <span
              className="w-1 h-1 rounded-full mt-2 flex-shrink-0"
              style={{ background: 'var(--text-disabled)' }}
            />
            <div>
              <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>
                {point.label}
              </span>
              <span className="mx-1.5" style={{ color: 'var(--text-disabled)' }}>—</span>
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                {point.value}
              </span>
              <span className="ml-1.5" style={{ color: 'var(--text-disabled)' }}>
                {point.context}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
