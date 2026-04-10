'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, AlertTriangle, Info } from 'lucide-react';
import { useTheme } from './ThemeProvider';

interface ExecBinData {
  project: string;
  bin: string;
  execCount: number;
  leadsCalledTotal: number;
  connectionRate: number;
  visitRate: number;
  bookingRate: number;
  niRate: number;
}

interface ExecPerformanceBinsProps {
  data: ExecBinData[];
}

const BIN_ORDER = ['A', 'B', 'C', 'D', 'Insufficient Data'];
const BIN_LABELS: Record<string, string> = {
  A: 'Top Performers (A)',
  B: 'Above Average (B)',
  C: 'Below Average (C)',
  D: 'Needs Improvement (D)',
  'Insufficient Data': 'Not Enough Data',
};

const BIN_DESCRIPTIONS: Record<string, string> = {
  A: 'Top 25% of agents — these agents connect with more leads, schedule more visits, and close more bookings compared to others handling similar lead types.',
  B: 'Above average (25th–50th percentile) — solid performers who are close to the top group.',
  C: 'Below average (50th–75th percentile) — these agents may benefit from training or process improvements.',
  D: 'Bottom 25% — these agents have the most room for improvement, with lower connection and conversion rates.',
};

function pct(val: number): string {
  return `${(val * 100).toFixed(1)}%`;
}

export default function ExecPerformanceBins({ data }: ExecPerformanceBinsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { theme } = useTheme();

  if (!data || data.length === 0) return null;

  // Separate by project, sort by bin order
  const landmarkBins = BIN_ORDER
    .map(bin => data.find(d => d.project === 'LANDMARK' && d.bin === bin))
    .filter((d): d is ExecBinData => !!d && d.bin !== 'Insufficient Data');
  const broadwayBins = BIN_ORDER
    .map(bin => data.find(d => d.project === 'BROADWAY' && d.bin === bin))
    .filter((d): d is ExecBinData => !!d && d.bin !== 'Insufficient Data');

  // Find meaningful comparisons: same bin across projects
  const comparisons = BIN_ORDER.filter(bin => bin !== 'Insufficient Data').map(bin => {
    const l = data.find(d => d.project === 'LANDMARK' && d.bin === bin);
    const b = data.find(d => d.project === 'BROADWAY' && d.bin === bin);
    return { bin, landmark: l, broadway: b };
  }).filter(c => c.landmark || c.broadway);

  return (
    <section className="mt-8">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-5 py-4 rounded-xl transition-all duration-200"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div className="flex items-center gap-3">
          <span
            className="text-sm font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            Agent Performance Ratings
          </span>
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider"
            style={{
              background: 'var(--warning-muted)',
              color: 'var(--warning)',
              letterSpacing: '0.08em',
            }}
          >
            Beta
          </span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
        ) : (
          <ChevronDown className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
        )}
      </button>

      {isOpen && (
        <div
          className="mt-2 rounded-xl p-5 space-y-6"
          style={{
            background: theme === 'dark'
              ? 'linear-gradient(135deg, rgba(30,30,40,0.95), rgba(25,25,35,0.98))'
              : 'linear-gradient(135deg, rgba(245,243,248,1), rgba(240,238,245,1))',
            border: theme === 'dark'
              ? '1px solid rgba(120,100,180,0.25)'
              : '1px solid rgba(140,120,180,0.2)',
          }}
        >
          {/* Warning banner */}
          <div
            className="flex items-start gap-3 px-4 py-3 rounded-lg"
            style={{
              background: 'var(--warning-muted)',
              border: '1px solid var(--warning)',
              opacity: 0.85,
            }}
          >
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--warning)' }} />
            <div className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              <strong style={{ color: 'var(--warning)' }}>Subject to errors.</strong>{' '}
              Agent ratings are calculated by comparing agents who handled similar types of leads and quality scores.
              Small sample sizes or unusual lead distributions can affect accuracy. Use this as a starting point, not a final judgement.
            </div>
          </div>

          {/* What are performance ratings? */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Info className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)', letterSpacing: '0.1em' }}>
                What are agent ratings?
              </span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
              Agents are rated A through D by comparing their results to other agents who worked with the same type and quality of leads.
              An &ldquo;A&rdquo; agent in the top 25% connected with more leads, scheduled more visits, and blocked more flats than 75% of their peers.
              Ratings update every 7 days and only count when an agent has handled enough leads for a fair comparison.
            </p>
          </div>

          {/* Rating breakdown table */}
          {comparisons.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)', letterSpacing: '0.1em' }}>
                Landmark vs Broadway — by agent rating
              </h4>

              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <th className="text-left py-2 pr-3 font-semibold" style={{ color: 'var(--text-secondary)' }}>Rating</th>
                      <th className="text-center py-2 px-2 font-semibold" style={{ color: 'var(--text-secondary)' }}>Agents</th>
                      <th className="text-center py-2 px-2 font-semibold" style={{ color: 'var(--text-secondary)' }}>Leads</th>
                      <th className="text-center py-2 px-2 font-semibold" style={{ color: 'var(--text-secondary)' }}>Connected</th>
                      <th className="text-center py-2 px-2 font-semibold" style={{ color: 'var(--text-secondary)' }}>Visit Rate</th>
                      <th className="text-center py-2 px-2 font-semibold" style={{ color: 'var(--text-secondary)' }}>Blocking Rate</th>
                      <th className="text-center py-2 px-2 font-semibold" style={{ color: 'var(--text-secondary)' }}>Not Interested</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisons.map(({ bin, landmark, broadway }) => {
                      if (!landmark && !broadway) return null;
                      return (
                        <tr key={bin}>
                          <td colSpan={7} className="pt-3 pb-1">
                            <div className="space-y-1">
                              <div className="font-semibold text-xs" style={{ color: 'var(--text-primary)' }}>
                                {BIN_LABELS[bin] || bin}
                              </div>
                              <div className="text-[10px] leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
                                {BIN_DESCRIPTIONS[bin] || ''}
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Detailed comparison cards per bin */}
                <div className="space-y-4 mt-4">
                  {comparisons.map(({ bin, landmark: l, broadway: b }) => {
                    if (!l && !b) return null;
                    return (
                      <div
                        key={bin}
                        className="rounded-lg p-4"
                        style={{
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                              {BIN_LABELS[bin] || bin}
                            </span>
                            <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                              {BIN_DESCRIPTIONS[bin] || ''}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          {/* Landmark column */}
                          {l && (
                            <div
                              className="rounded-md p-3 space-y-2"
                              style={{ background: 'var(--bg-hover)' }}
                            >
                              <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                                Landmark
                              </div>
                              <div className="space-y-1.5">
                                <MetricRow label="Agents" value={String(l.execCount)} />
                                <MetricRow label="Leads handled" value={l.leadsCalledTotal.toLocaleString()} />
                                <MetricRow label="Connected" value={pct(l.connectionRate)} highlight={l.connectionRate > 0.5} />
                                <MetricRow label="Visit rate" value={pct(l.visitRate)} highlight={l.visitRate > 0.05} />
                                <MetricRow label="Blocking rate" value={pct(l.bookingRate)} highlight={l.bookingRate > 0.01} />
                                <MetricRow label="Not interested" value={pct(l.niRate)} warn={l.niRate > 0.4} />
                              </div>
                            </div>
                          )}

                          {/* Broadway column */}
                          {b && (
                            <div
                              className="rounded-md p-3 space-y-2"
                              style={{ background: 'var(--bg-hover)' }}
                            >
                              <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                                Broadway
                              </div>
                              <div className="space-y-1.5">
                                <MetricRow label="Agents" value={String(b.execCount)} />
                                <MetricRow label="Leads handled" value={b.leadsCalledTotal.toLocaleString()} />
                                <MetricRow label="Connected" value={pct(b.connectionRate)} highlight={b.connectionRate > 0.5} />
                                <MetricRow label="Visit rate" value={pct(b.visitRate)} highlight={b.visitRate > 0.05} />
                                <MetricRow label="Blocking rate" value={pct(b.bookingRate)} highlight={b.bookingRate > 0.01} />
                                <MetricRow label="Not interested" value={pct(b.niRate)} warn={b.niRate > 0.4} />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Analysis note */}
                        {l && b && (
                          <BinAnalysis bin={bin} landmark={l} broadway={b} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function MetricRow({ label, value, highlight, warn }: { label: string; value: string; highlight?: boolean; warn?: boolean }) {
  let color = 'var(--text-tertiary)';
  if (highlight) color = 'var(--positive)';
  if (warn) color = 'var(--warning)';
  return (
    <div className="flex items-center justify-between text-[11px]">
      <span style={{ color: 'var(--text-tertiary)' }}>{label}</span>
      <span className="font-medium" style={{ color }}>{value}</span>
    </div>
  );
}

function BinAnalysis({ bin, landmark: l, broadway: b }: { bin: string; landmark: ExecBinData; broadway: ExecBinData }) {
  const notes: string[] = [];

  // Connection rate comparison
  const connDiff = Math.abs(l.connectionRate - b.connectionRate);
  if (connDiff > 0.03) {
    const better = l.connectionRate > b.connectionRate ? 'Landmark' : 'Broadway';
    notes.push(`${better}'s "${BIN_LABELS[bin]?.split(' (')[0]}" agents had a ${(connDiff * 100).toFixed(1)} percentage point higher connection rate.`);
  }

  // Visit rate comparison
  const visitDiff = Math.abs(l.visitRate - b.visitRate);
  if (visitDiff > 0.02 && (l.visitRate > 0 || b.visitRate > 0)) {
    const better = l.visitRate > b.visitRate ? 'Landmark' : 'Broadway';
    notes.push(`${better}'s agents scheduled ${(visitDiff * 100).toFixed(1)} percentage points more visits per lead.`);
  }

  // NI rate comparison
  const niDiff = Math.abs(l.niRate - b.niRate);
  if (niDiff > 0.1) {
    const worse = l.niRate > b.niRate ? 'Landmark' : 'Broadway';
    notes.push(`${worse}'s agents had a notably higher "not interested" rate (${pct(Math.max(l.niRate, b.niRate))} vs ${pct(Math.min(l.niRate, b.niRate))}).`);
  }

  // Volume comparison
  if (l.leadsCalledTotal > 0 && b.leadsCalledTotal > 0) {
    const ratio = l.leadsCalledTotal / b.leadsCalledTotal;
    if (ratio > 2 || ratio < 0.5) {
      const bigger = l.leadsCalledTotal > b.leadsCalledTotal ? 'Broadway' : 'Landmark';
      notes.push(`${bigger} had significantly more leads in this group, which gives more confidence in their numbers.`);
    }
  }

  // If no meaningful differences found
  if (notes.length === 0) {
    if (l.leadsCalledTotal < 20 || b.leadsCalledTotal < 20) {
      notes.push('One or both campaigns had too few leads in this group for a reliable comparison.');
    } else {
      notes.push('Both campaigns showed similar performance patterns in this agent group.');
    }
  }

  return (
    <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
      <p className="text-[10px] leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
        {notes.join(' ')}
      </p>
    </div>
  );
}

interface ExecBinData {
  project: string;
  bin: string;
  execCount: number;
  leadsCalledTotal: number;
  connectionRate: number;
  visitRate: number;
  bookingRate: number;
  niRate: number;
}
