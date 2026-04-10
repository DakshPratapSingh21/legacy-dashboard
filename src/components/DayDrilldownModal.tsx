'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Info } from 'lucide-react';
import { DRILLDOWN, SCORE_BUCKET_LEGEND } from '@/lib/labels';

/* =================================================================
   Day Drill-down Modal — plain English, unique-leads based
   Shows full metrics for a specific campaign day.
   All labels are human-readable, no PSV/SV/FB jargon.
   ================================================================= */

interface DayMetrics {
  totalCalls: number;
  answeredCalls: number;
  firstCallLeads: number;
  pickupRate: number;
  psvLeads: number;
  psvRate: number;
  cumulativeFb: number;
  cumulativeSc: number;
}

interface NriSplit {
  indiaLeads: number;
  nriLeads: number;
  indiaConnectionRate: number;
  nriConnectionRate: number;
}

interface DayDrilldownData {
  day: number;
  broadway: DayMetrics | null;
  landmark: DayMetrics | null;
  legacy: DayMetrics | null;
  nriSplit?: {
    broadway: NriSplit | null;
    landmark: NriSplit | null;
  };
}

interface DayDrilldownModalProps {
  data: DayDrilldownData | null;
  onClose: () => void;
}

function InfoButton({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  return (
    <button
      className="relative w-4 h-4 flex items-center justify-center rounded-full ml-1 min-h-[44px] min-w-[44px] -m-3"
      style={{ color: 'var(--text-disabled)' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
      aria-label="More info"
    >
      <Info className="w-3 h-3" />
      {show && (
        <div
          className="absolute top-full right-0 mt-2 w-56 p-2.5 rounded-md text-[10px] leading-relaxed z-[20] anim-fade whitespace-pre-line"
          style={{
            background: 'var(--tooltip-bg)',
            color: 'var(--tooltip-text)',
            border: '1px solid var(--tooltip-border)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          {text}
        </div>
      )}
    </button>
  );
}

function MetricRow({ label, broadway, landmark, legacy, format = 'number', info }: {
  label: string;
  broadway: number | null;
  landmark: number | null;
  legacy?: number | null;
  format?: 'number' | 'rate' | 'ratio';
  info?: string;
}) {
  const fmt = (v: number | null): string => {
    if (v === null || v === undefined) return '—';
    if (format === 'rate') return `${(v * 100).toFixed(1)}%`;
    if (format === 'ratio') return v.toFixed(2);
    return v.toLocaleString();
  };

  return (
    <div
      className="grid grid-cols-2 gap-4 p-4 rounded-lg"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
    >
      <div className="col-span-2 flex items-center">
        <span
          className="text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: 'var(--text-disabled)', letterSpacing: '0.1em' }}
        >
          {label}
        </span>
        {info && <InfoButton text={info} />}
      </div>
      <div>
        <span className="text-lg font-bold" style={{ color: 'var(--chart-broadway)' }}>{fmt(broadway)}</span>
        <span className="text-[10px] block" style={{ color: 'var(--text-disabled)' }}>Broadway</span>
      </div>
      <div>
        <span className="text-lg font-bold" style={{ color: 'var(--chart-landmark)' }}>{fmt(landmark)}</span>
        <span className="text-[10px] block" style={{ color: 'var(--text-disabled)' }}>Landmark</span>
      </div>
      {legacy !== undefined && legacy !== null && (
        <div className="col-span-2 pt-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <span className="text-lg font-bold" style={{ color: 'var(--chart-legacy)' }}>{fmt(legacy)}</span>
          <span className="text-[10px] ml-1" style={{ color: 'var(--text-disabled)' }}>Legacy</span>
        </div>
      )}
    </div>
  );
}

function NriSplitCard({ nriSplit }: { nriSplit: { broadway: NriSplit | null; landmark: NriSplit | null } }) {
  const b = nriSplit.broadway;
  const l = nriSplit.landmark;
  if (!b && !l) return null;

  return (
    <div
      className="col-span-2 p-4 rounded-lg"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
    >
      <div className="flex items-center mb-3">
        <span
          className="text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: 'var(--text-disabled)', letterSpacing: '0.1em' }}
        >
          Lead Origin Split — India vs NRI
        </span>
        <InfoButton text="Shows how leads are split between India-based and NRI (Non-Resident Indian) leads, and how connection rates differ. NRI leads tend to connect better in evenings, India leads in mornings." />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Broadway */}
        {b && (
          <div className="space-y-2">
            <span className="text-[10px] font-semibold" style={{ color: 'var(--chart-broadway)' }}>Broadway</span>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <div className="flex items-baseline justify-between">
                  <span className="text-[10px]" style={{ color: 'var(--text-disabled)' }}>India</span>
                  <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{b.indiaLeads.toLocaleString()}</span>
                </div>
                <div className="w-full h-1.5 rounded-full mt-1 overflow-hidden" style={{ background: 'var(--bg-hover)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${b.indiaLeads / (b.indiaLeads + b.nriLeads) * 100}%`,
                      background: 'var(--chart-broadway)',
                      opacity: 0.7,
                    }}
                  />
                </div>
                <span className="text-[9px]" style={{ color: 'var(--text-disabled)' }}>{(b.indiaConnectionRate * 100).toFixed(1)}% connected</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <div className="flex items-baseline justify-between">
                  <span className="text-[10px]" style={{ color: 'var(--text-disabled)' }}>NRI</span>
                  <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{b.nriLeads.toLocaleString()}</span>
                </div>
                <div className="w-full h-1.5 rounded-full mt-1 overflow-hidden" style={{ background: 'var(--bg-hover)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${b.nriLeads / (b.indiaLeads + b.nriLeads) * 100}%`,
                      background: 'var(--chart-broadway)',
                    }}
                  />
                </div>
                <span className="text-[9px]" style={{ color: 'var(--text-disabled)' }}>{(b.nriConnectionRate * 100).toFixed(1)}% connected</span>
              </div>
            </div>
          </div>
        )}

        {/* Landmark */}
        {l && (
          <div className="space-y-2">
            <span className="text-[10px] font-semibold" style={{ color: 'var(--chart-landmark)' }}>Landmark</span>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <div className="flex items-baseline justify-between">
                  <span className="text-[10px]" style={{ color: 'var(--text-disabled)' }}>India</span>
                  <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{l.indiaLeads.toLocaleString()}</span>
                </div>
                <div className="w-full h-1.5 rounded-full mt-1 overflow-hidden" style={{ background: 'var(--bg-hover)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${l.indiaLeads / (l.indiaLeads + l.nriLeads) * 100}%`,
                      background: 'var(--chart-landmark)',
                      opacity: 0.7,
                    }}
                  />
                </div>
                <span className="text-[9px]" style={{ color: 'var(--text-disabled)' }}>{(l.indiaConnectionRate * 100).toFixed(1)}% connected</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <div className="flex items-baseline justify-between">
                  <span className="text-[10px]" style={{ color: 'var(--text-disabled)' }}>NRI</span>
                  <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{l.nriLeads.toLocaleString()}</span>
                </div>
                <div className="w-full h-1.5 rounded-full mt-1 overflow-hidden" style={{ background: 'var(--bg-hover)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${l.nriLeads / (l.indiaLeads + l.nriLeads) * 100}%`,
                      background: 'var(--chart-landmark)',
                    }}
                  />
                </div>
                <span className="text-[9px]" style={{ color: 'var(--text-disabled)' }}>{(l.nriConnectionRate * 100).toFixed(1)}% connected</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DayDrilldownModal({ data, onClose }: DayDrilldownModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!data) return;
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [data, onClose]);

  if (!data) return null;

  const handleOverlayClick = (e: React.MouseEvent) => { if (e.target === e.currentTarget) onClose(); };

  const b = data.broadway;
  const l = data.landmark;
  const leg = data.legacy;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 modal-overlay anim-fade" onClick={handleOverlayClick}>
      <div
        ref={modalRef}
        className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-xl anim-scale"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-lg)' }}
      >
        {/* Header */}
        <div className="sticky top-0 z-[10] flex items-center justify-between p-5 pb-3" style={{ background: 'var(--bg-surface)' }}>
          <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
            Day {data.day} — Full Breakdown
          </h2>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-md min-h-[44px] min-w-[44px] -m-2"
            style={{ color: 'var(--text-tertiary)', background: 'var(--bg-hover)' }}
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Metrics grid — restructured, no duplicates */}
        <div className="grid grid-cols-2 gap-3 p-5 pt-2">
          <MetricRow
            label={DRILLDOWN.UNIQUE_LEADS}
            broadway={b?.firstCallLeads ?? null}
            landmark={l?.firstCallLeads ?? null}
            legacy={leg?.firstCallLeads}
            info="The number of individual leads called for the first time. Each lead is counted only once, even if called multiple times."
          />
          <MetricRow
            label={DRILLDOWN.TOTAL_CALLS}
            broadway={b?.totalCalls ?? null}
            landmark={l?.totalCalls ?? null}
            legacy={leg?.totalCalls}
            info="Total number of calls made, including repeat calls to the same lead. Compare with Unique Leads to see how many retries were needed."
          />
          <MetricRow
            label={DRILLDOWN.CONNECTION_RATE}
            broadway={b?.pickupRate ?? null}
            landmark={l?.pickupRate ?? null}
            legacy={leg?.pickupRate}
            format="rate"
            info="Percentage of unique leads who answered the call. Higher means the team is reaching more people."
          />
          <MetricRow
            label={DRILLDOWN.VISITS_SCHEDULED}
            broadway={b?.psvLeads ?? null}
            landmark={l?.psvLeads ?? null}
            legacy={leg?.psvLeads}
            info="How many unique leads agreed to schedule a visit to the property."
          />
          <MetricRow
            label={DRILLDOWN.VISIT_SCHEDULE_RATE}
            broadway={b?.psvRate ?? null}
            landmark={l?.psvRate ?? null}
            legacy={leg?.psvRate}
            format="rate"
            info="Of all unique leads called, what percentage scheduled a visit? This measures how persuasive the calls were."
          />
          <MetricRow
            label={DRILLDOWN.CUMULATIVE_BOOKINGS}
            broadway={b?.cumulativeFb ?? null}
            landmark={l?.cumulativeFb ?? null}
            legacy={leg?.cumulativeFb}
            info="Running total of flats blocked up to this day."
          />
          <MetricRow
            label={DRILLDOWN.CUMULATIVE_DEALS}
            broadway={b?.cumulativeSc ?? null}
            landmark={l?.cumulativeSc ?? null}
            legacy={leg?.cumulativeSc}
            info="Running total of fully closed sales up to this day."
          />

          {/* NRI / India lead split — full-width card */}
          {data.nriSplit && <NriSplitCard nriSplit={data.nriSplit} />}
        </div>

        {/* Score bucket legend */}
        <div className="px-5 pb-5">
          <details className="text-[10px] leading-relaxed" style={{ color: 'var(--text-disabled)' }}>
            <summary className="cursor-pointer font-medium flex items-center gap-1" style={{ color: 'var(--text-tertiary)' }}>
              <Info className="w-3 h-3 inline" /> What are Lead Quality Scores?
            </summary>
            <p className="mt-2 whitespace-pre-line pl-4" style={{ color: 'var(--text-disabled)' }}>
              {SCORE_BUCKET_LEGEND}
            </p>
          </details>
        </div>
      </div>
    </div>
  );
}

export type { DayDrilldownData, DayMetrics, NriSplit };
