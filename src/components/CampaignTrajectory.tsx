'use client';

import { useState, useCallback } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts';
import { useTheme } from './ThemeProvider';
import { TRAJECTORY_TABS } from '@/lib/labels';

/* =================================================================
   Campaign Trajectory — multi-tab interactive graph
   All metrics are based on UNIQUE LEADS, not call counts.
   Language is plain English — no PSV/SV/FB jargon.
   ================================================================= */

interface TrajectoryPoint {
  day: number;
  cumulativeUniqueLeads?: number;
  cumulativeAnswered?: number;
  cumulativePickupRate?: number;
  cumulativePsv?: number;
  cumulativeConvRatePsv?: number;
  cumulativeSv?: number;
  cumulativeConvRateSv?: number;
  cumulativeFb?: number;
  cumulativeConvRateFb?: number;
  cumulativeSc?: number;
  cumulativeNi?: number;
  totalCalls?: number;
  leadsCalled?: number;
  // pass-through fields from API
  fb?: number;
  psv?: number;
  sv?: number;
  sc?: number;
  ni?: number;
  leadsPickedUp?: number;
  pickupRate?: number;
  convRatePsv?: number;
  convRateSv?: number;
  convRateFb?: number;
}

interface CampaignTrajectoryProps {
  landmark: TrajectoryPoint[];
  broadway: TrajectoryPoint[];
  legacy: TrajectoryPoint[] | null;
  onDayClick?: (day: number) => void;
}

type TabKey = 'pickup' | 'visitScheduled' | 'visitCompleted' | 'bookings';

const TABS: { key: TabKey; label: string; subtitle: string; metric: string; isRate: boolean }[] = [
  { key: 'pickup', label: TRAJECTORY_TABS.PICKUP.label, subtitle: TRAJECTORY_TABS.PICKUP.subtitle, metric: 'cumulativePickupRate', isRate: true },
  { key: 'visitScheduled', label: TRAJECTORY_TABS.VISIT_SCHEDULED.label, subtitle: TRAJECTORY_TABS.VISIT_SCHEDULED.subtitle, metric: 'cumulativeConvRatePsv', isRate: true },
  { key: 'visitCompleted', label: TRAJECTORY_TABS.VISIT_COMPLETED.label, subtitle: TRAJECTORY_TABS.VISIT_COMPLETED.subtitle, metric: 'cumulativeConvRateSv', isRate: true },
  { key: 'bookings', label: TRAJECTORY_TABS.BOOKINGS.label, subtitle: TRAJECTORY_TABS.BOOKINGS.subtitle, metric: 'cumulativeFb', isRate: false },
];

function getChartColors(theme: string) {
  if (theme === 'dark') {
    return { landmark: '#6B82E8', broadway: '#D4A745', legacy: '#1E9B52', grid: '#262D3D', textMuted: '#707A8C' };
  }
  return { landmark: '#4560C9', broadway: '#B8882A', legacy: '#157A3E', grid: '#E5E7EB', textMuted: '#6B7280' };
}

// Custom tooltip showing unique-leads data
function CustomTooltip({ active, payload, label, activeTab }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string; payload: Record<string, number> }>;
  label?: number;
  activeTab: TabKey;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div
      className="rounded-lg text-[11px] leading-relaxed"
      style={{
        background: 'var(--tooltip-bg)',
        border: '1px solid var(--tooltip-border)',
        color: 'var(--tooltip-text)',
        padding: '10px 12px',
        boxShadow: 'var(--shadow-lg)',
        maxWidth: 260,
      }}
    >
      <div className="font-semibold mb-2">Campaign Day {label}</div>
      {payload.map((entry, i) => {
        const raw = entry.payload;
        const name = entry.name;

        // Show unique-leads-based context depending on tab
        let detail = '';
        if (activeTab === 'pickup') {
          const leads = raw[`${name.toLowerCase()}_leads`];
          const answered = raw[`${name.toLowerCase()}_answered`];
          if (leads) detail = ` — ${answered?.toLocaleString() || '?'} of ${leads.toLocaleString()} unique leads connected`;
        } else if (activeTab === 'visitScheduled') {
          const leads = raw[`${name.toLowerCase()}_leads`];
          const psv = raw[`${name.toLowerCase()}_psv`];
          if (leads) detail = ` — ${psv?.toLocaleString() || '?'} of ${leads.toLocaleString()} unique leads scheduled a visit`;
        } else if (activeTab === 'visitCompleted') {
          const leads = raw[`${name.toLowerCase()}_leads`];
          const sv = raw[`${name.toLowerCase()}_sv`];
          if (leads != null && sv != null) detail = ` — ${Math.round(sv)} visits from ${Math.round(leads)} new leads that day`;
        }

        const isRate = activeTab !== 'bookings';

        return (
          <div key={i} className="flex items-start gap-2 mb-1">
            <span className="w-2 h-2 rounded-sm mt-1 flex-shrink-0" style={{ background: entry.color }} />
            <span>
              <strong>{name}:</strong> {isRate ? `${entry.value.toFixed(1)}%` : entry.value.toLocaleString()}
              {detail && <span className="opacity-70">{detail}</span>}
            </span>
          </div>
        );
      })}
      <div className="text-[9px] mt-2 opacity-50">Click for full breakdown</div>
    </div>
  );
}

export default function CampaignTrajectory({ landmark, broadway, legacy, onDayClick }: CampaignTrajectoryProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('pickup');
  const { theme } = useTheme();
  const colors = getChartColors(theme);

  const tabConfig = TABS.find((t) => t.key === activeTab)!;

  // Merge data with extra context fields for tooltip
  const mergeData = useCallback(() => {
    const dayMap = new Map<number, Record<string, number>>();

    const addPoints = (points: TrajectoryPoint[], prefix: string) => {
      for (const p of points) {
        const existing = dayMap.get(p.day) || { day: p.day };
        const metricKey = tabConfig.metric as keyof TrajectoryPoint;
        const val = p[metricKey];
        if (val !== undefined && val !== null) {
          existing[`${prefix}_val`] = tabConfig.isRate ? Number(val) * 100 : Number(val);
        }
        // Add context fields for tooltip
        existing[`${prefix}_leads`] = p.cumulativeUniqueLeads ?? p.leadsCalled ?? 0;
        existing[`${prefix}_answered`] = p.cumulativeAnswered ?? p.leadsPickedUp ?? 0;
        existing[`${prefix}_psv`] = p.cumulativePsv ?? p.psv ?? 0;
        existing[`${prefix}_sv`] = p.cumulativeSv ?? p.sv ?? 0;
        existing[`${prefix}_fb`] = p.cumulativeFb ?? p.fb ?? 0;
        dayMap.set(p.day, existing);
      }
    };

    addPoints(landmark, 'broadway'); // intentional: broadway first for chart order
    addPoints(broadway, 'broadway');
    addPoints(landmark, 'landmark');
    if (legacy) addPoints(legacy, 'legacy');

    return Array.from(dayMap.values()).sort((a, b) => a.day - b.day);
  }, [landmark, broadway, legacy, tabConfig.metric, tabConfig.isRate]);

  // Build chart data — for the "Visit Completion Rate" tab we compute
  // day-on-day rates (today's delta / today's new leads) instead of showing
  // cumulative rates, because cumulative flattens out and hides daily trends.
  const isDayLevel = activeTab === 'visitCompleted';

  const chartData = useCallback(() => {
    const dayMap = new Map<number, Record<string, number>>();

    const addPoints = (points: TrajectoryPoint[], prefix: string) => {
      // Sort by day to compute deltas
      const sorted = [...points].sort((a, b) => (a.day ?? 0) - (b.day ?? 0));

      for (let i = 0; i < sorted.length; i++) {
        const p = sorted[i];
        const prev = i > 0 ? sorted[i - 1] : null;
        const existing = dayMap.get(p.day) || { day: p.day };

        if (isDayLevel) {
          // Day-level: compute delta from previous day's cumulative
          const daySv = prev ? (p.cumulativeSv ?? p.sv ?? 0) - (prev.cumulativeSv ?? prev.sv ?? 0) : (p.cumulativeSv ?? p.sv ?? 0);
          const dayLeads = prev ? (p.cumulativeUniqueLeads ?? p.leadsCalled ?? 0) - (prev.cumulativeUniqueLeads ?? prev.leadsCalled ?? 0) : (p.cumulativeUniqueLeads ?? p.leadsCalled ?? 0);
          const dayRate = dayLeads > 0 ? daySv / dayLeads : 0;
          existing[`${prefix}_val`] = dayRate * 100;
          existing[`${prefix}_sv`] = Math.max(0, daySv);
          existing[`${prefix}_leads`] = Math.max(0, dayLeads);
        } else {
          // Cumulative (all other tabs)
          const metricKey = tabConfig.metric as keyof TrajectoryPoint;
          const val = p[metricKey];
          if (val !== undefined && val !== null) {
            existing[`${prefix}_val`] = tabConfig.isRate ? Number(val) * 100 : Number(val);
          }
          existing[`${prefix}_leads`] = p.cumulativeUniqueLeads ?? p.leadsCalled ?? 0;
          existing[`${prefix}_sv`] = p.cumulativeSv ?? p.sv ?? 0;
        }

        existing[`${prefix}_answered`] = p.cumulativeAnswered ?? p.leadsPickedUp ?? 0;
        existing[`${prefix}_psv`] = p.cumulativePsv ?? p.psv ?? 0;
        existing[`${prefix}_fb`] = p.cumulativeFb ?? p.fb ?? 0;
        dayMap.set(p.day, existing);
      }
    };

    addPoints(broadway, 'broadway');
    addPoints(landmark, 'landmark');
    if (legacy) addPoints(legacy, 'legacy');

    return Array.from(dayMap.values()).sort((a, b) => a.day - b.day);
  }, [landmark, broadway, legacy, tabConfig.metric, tabConfig.isRate, isDayLevel])();

  const axisTickStyle = { fontSize: 10, fill: colors.textMuted, fontFamily: 'DM Sans' };

  const handleChartClick = (data: { activePayload?: Array<{ payload: Record<string, number> }> }) => {
    if (data?.activePayload?.[0]?.payload?.day && onDayClick) {
      onDayClick(data.activePayload[0].payload.day);
    }
  };

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div className="px-5 pt-5 pb-0">
        <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
          Campaign Progress
        </h2>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
          How each campaign performed over time — based on unique leads, not repeat calls
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 px-5 mt-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="px-4 py-2.5 text-xs font-medium transition-colors duration-150 relative min-h-[44px]"
            style={{ color: activeTab === tab.key ? 'var(--accent)' : 'var(--text-tertiary)' }}
          >
            {tab.label}
            {activeTab === tab.key && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: 'var(--accent)' }} />
            )}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="p-5">
        <p className="text-[10px] mb-3" style={{ color: 'var(--text-disabled)' }}>
          {tabConfig.subtitle}. Click any point to see the full picture for that day.
        </p>
        <ResponsiveContainer width="100%" height={340}>
          <LineChart
            data={chartData}
            margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
            onClick={handleChartClick}
            style={{ cursor: onDayClick ? 'pointer' : 'default' }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
            <XAxis
              dataKey="day"
              tick={axisTickStyle}
              axisLine={{ stroke: colors.grid }}
              tickLine={false}
              tickFormatter={(v) => `Day ${v}`}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={axisTickStyle}
              axisLine={false}
              tickLine={false}
              width={45}
              tickFormatter={(v) => tabConfig.isRate ? `${v}%` : v.toLocaleString()}
            />
            <Tooltip content={<CustomTooltip activeTab={activeTab} />} />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} iconType="square" iconSize={8} />
            <Line type="monotone" dataKey="broadway_val" name="Broadway" stroke={colors.broadway} strokeWidth={2} dot={false} connectNulls />
            <Line type="monotone" dataKey="landmark_val" name="Landmark" stroke={colors.landmark} strokeWidth={2} dot={false} connectNulls />
            {legacy && (
              <Line type="monotone" dataKey="legacy_val" name="Legacy" stroke={colors.legacy} strokeWidth={2.5} dot={false} connectNulls />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export type { TrajectoryPoint };
