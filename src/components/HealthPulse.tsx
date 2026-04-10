'use client';

import { TrendingUp, TrendingDown, Minus, Target, Phone, ArrowRightLeft } from 'lucide-react';
import type { HealthPulseData } from '@/lib/types';

interface HealthPulseProps {
  data: HealthPulseData;
}

const configs = {
  pacing: { icon: Target, label: 'Flats Blocked' },
  pickup: { icon: Phone, label: 'Connection Rate' },
  handoff: { icon: ArrowRightLeft, label: 'Visit Follow-Through' },
} as const;

const trendIcons = { up: TrendingUp, down: TrendingDown, stable: Minus };

/* Status → OKLCH color mapping — NO colored left-borders */
const statusStyles = {
  good: {
    indicator: 'var(--positive)',
    bg: 'var(--positive-muted)',
    text: 'var(--positive)',
  },
  warning: {
    indicator: 'var(--warning)',
    bg: 'var(--warning-muted)',
    text: 'var(--warning)',
  },
  critical: {
    indicator: 'var(--critical)',
    bg: 'var(--critical-muted)',
    text: 'var(--critical)',
  },
};

export default function HealthPulse({ data }: HealthPulseProps) {
  const metrics: { key: 'pacing' | 'pickup' | 'handoff' }[] = [
    { key: 'pacing' }, { key: 'pickup' }, { key: 'handoff' },
  ];

  return (
    <section className="anim-fade">
      <h2
        className="text-xs font-semibold uppercase tracking-widest mb-4"
        style={{ color: 'var(--text-disabled)', letterSpacing: '0.1em' }}
      >
        Health Pulse
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {metrics.map(({ key }) => {
          const metric = data[key];
          const cfg = configs[key];
          const Icon = cfg.icon;
          const TrendIcon = trendIcons[metric.trend];
          const style = statusStyles[metric.status];

          return (
            <div
              key={key}
              className="group relative rounded-lg p-5 transition-shadow duration-200 hover:shadow-card-hover"
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              {/* Status dot — top right, subtle */}
              <div
                className="absolute top-4 right-4 w-2 h-2 rounded-full"
                style={{ background: style.indicator }}
              />

              {/* Icon + label */}
              <div className="flex items-center gap-2 mb-3">
                <Icon className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                  {metric.label}
                </span>
              </div>

              {/* Value — dominant, high contrast */}
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-xl font-semibold tracking-tight" style={{ color: style.text }}>
                  {metric.value}
                </span>
                <TrendIcon className="w-3.5 h-3.5" style={{ color: style.text }} />
              </div>

              {/* Benchmark comparison — tight grouping */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs">
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: 'var(--chart-landmark)' }}
                  />
                  <span style={{ color: 'var(--text-tertiary)' }}>{metric.vsLandmark}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: 'var(--chart-broadway)' }}
                  />
                  <span style={{ color: 'var(--text-tertiary)' }}>{metric.vsBroadway}</span>
                </div>
              </div>

              {/* Detail — generous top spacing */}
              <p className="mt-4 text-xs leading-relaxed" style={{ color: 'var(--text-disabled)' }}>
                {metric.detail}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
