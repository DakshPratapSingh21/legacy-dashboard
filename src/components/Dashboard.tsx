'use client';

/* =================================================================
   Dashboard — restructured layout:
   1. Insights (what's working + actions)
   2. Executive Health Cards (TBU for Legacy, benchmark values)
   3. Campaign Trajectory (multi-tab interactive graph)
   4. Evidence (supporting charts)
   5. Suggestions
   ================================================================= */

import { useEffect, useState, useCallback } from 'react';
import type { Insight, SuggestionItem, HealthPulseData } from '@/lib/types';
import { HEALTH_CARDS } from '@/lib/labels';
import Header from './Header';
import ExecutiveHealthCards from './ExecutiveHealthCards';
import type { MetricCardData } from './ExecutiveHealthCards';
import CampaignTrajectory from './CampaignTrajectory';
import type { TrajectoryPoint } from './CampaignTrajectory';
import DayDrilldownModal from './DayDrilldownModal';
import type { DayDrilldownData, NriSplit } from './DayDrilldownModal';
import InsightCard from './InsightCard';
import { VelocityChart, ScoreBucketChart, CallingPatternChart, HandoffChart } from './EvidenceChart';
import SuggestionBoard from './SuggestionBoard';
import ExecPerformanceBins from './ExecPerformanceBins';
import Footer from './Footer';
import { useTheme } from './ThemeProvider';

interface PacingSummary {
  latestDay: number;
  fb: number;
  sc: number;
  psv: number;
  sv: number;
  leadsCalled: number;
  pickupRate: number;
  projectedFb60: number | null;
  projectedFb90: number | null;
}

interface DayDrilldownApiMetrics {
  day: number;
  project: string;
  totalCalls: number;
  answeredCalls: number;
  firstCallLeads: number;
  pickupRate: number;
  psvLeads: number;
  psvRate: number;
}

interface ApiResponse {
  mode: 'demo' | 'live';
  currentCampaignDay: number | null;
  healthPulse: HealthPulseData;
  insights: Insight[];
  suggestions: SuggestionItem[];
  pacing: {
    landmark: PacingSummary;
    broadway: PacingSummary;
    legacy: PacingSummary | null;
  };
  trajectory: {
    landmark: TrajectoryPoint[];
    broadway: TrajectoryPoint[];
    legacy: TrajectoryPoint[] | null;
  };
  velocity: {
    landmark: TrajectoryPoint[];
    broadway: TrajectoryPoint[];
    legacy: TrajectoryPoint[] | null;
  };
  callingPatterns: {
    landmark: { timeSlot: string; pickupRate: number; convRatePsv: number; totalCalls: number }[];
    broadway: { timeSlot: string; pickupRate: number; convRatePsv: number; totalCalls: number }[];
    legacy: { timeSlot: string; pickupRate: number; convRatePsv: number; totalCalls: number }[] | null;
  };
  scoreBuckets: { scoreBucket: string; project: string; fbPer100: number; convRatePsv: number }[];
  handoffs: {
    landmark: { rate: number; dropRate: number; weeklyTrend: { week: number; rate: number }[] };
    broadway: { rate: number; dropRate: number; weeklyTrend: { week: number; rate: number }[] };
    legacy: { rate: number; dropRate: number; weeklyTrend: { week: number; rate: number }[] } | null;
  };
  dayDrilldown: {
    landmark: Record<number, DayDrilldownApiMetrics>;
    broadway: Record<number, DayDrilldownApiMetrics>;
    legacy: Record<number, DayDrilldownApiMetrics> | null;
  };
  nriPatterns: {
    landmark: NriPatternApi[];
    broadway: NriPatternApi[];
    legacy: NriPatternApi[] | null;
  };
  dayNri: {
    landmark: Record<number, DayNriApi>;
    broadway: Record<number, DayNriApi>;
    legacy: Record<number, DayNriApi> | null;
  };
  execBins: ExecBinData[];
}

interface NriPatternApi {
  nriStatus: string;
  timeSlot: string;
  project: string;
  totalCalls: number;
  answeredCalls: number;
  firstCallLeads: number;
  pickupRate: number;
}

interface DayNriApi {
  indiaLeads: number;
  nriLeads: number;
  indiaConnectionRate: number;
  nriConnectionRate: number;
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

function buildHealthCards(pacing: ApiResponse['pacing'], mode: string): MetricCardData[] {
  const l = pacing.landmark;
  const b = pacing.broadway;
  const leg = pacing.legacy;

  return [
    {
      label: HEALTH_CARDS.BOOKINGS.label,
      legacyValue: leg ? leg.fb : null,
      broadwayValue: b.fb,
      landmarkValue: l.fb,
      tooltip: HEALTH_CARDS.BOOKINGS.tooltip,
      format: 'number',
    },
    {
      label: HEALTH_CARDS.DEALS.label,
      legacyValue: leg ? leg.sc : null,
      broadwayValue: b.sc,
      landmarkValue: l.sc,
      tooltip: HEALTH_CARDS.DEALS.tooltip,
      format: 'number',
    },
    {
      label: HEALTH_CARDS.BOOKINGS_PER_100.label,
      legacyValue: leg && leg.leadsCalled > 0 ? (leg.fb / leg.leadsCalled * 100) : null,
      broadwayValue: b.leadsCalled > 0 ? (b.fb / b.leadsCalled * 100) : 0,
      landmarkValue: l.leadsCalled > 0 ? (l.fb / l.leadsCalled * 100) : 0,
      tooltip: HEALTH_CARDS.BOOKINGS_PER_100.tooltip,
      format: 'ratio',
    },
    {
      label: HEALTH_CARDS.CONNECTION_RATE.label,
      legacyValue: leg ? leg.pickupRate : null,
      broadwayValue: b.pickupRate,
      landmarkValue: l.pickupRate,
      tooltip: HEALTH_CARDS.CONNECTION_RATE.tooltip,
      format: 'rate',
    },
  ];
}

function buildTrajectoryData(trajectory: ApiResponse['trajectory']): {
  landmark: TrajectoryPoint[];
  broadway: TrajectoryPoint[];
  legacy: TrajectoryPoint[] | null;
} {
  // Trajectory data already comes with all fields from the expanded PacingAnalysis
  return {
    landmark: trajectory.landmark.map((p) => ({
      ...p,
      cumulativeUniqueLeads: p.leadsCalled,
      cumulativeAnswered: p.leadsPickedUp,
      cumulativePickupRate: p.pickupRate,
      cumulativePsv: p.psv,
      cumulativeConvRatePsv: p.convRatePsv,
      cumulativeSv: p.sv,
      cumulativeConvRateSv: p.convRateSv,
      cumulativeFb: p.fb,
      cumulativeConvRateFb: p.convRateFb,
      cumulativeSc: p.sc,
      cumulativeNi: p.ni,
      totalCalls: p.totalCalls,
    })),
    broadway: trajectory.broadway.map((p) => ({
      ...p,
      cumulativeUniqueLeads: p.leadsCalled,
      cumulativeAnswered: p.leadsPickedUp,
      cumulativePickupRate: p.pickupRate,
      cumulativePsv: p.psv,
      cumulativeConvRatePsv: p.convRatePsv,
      cumulativeSv: p.sv,
      cumulativeConvRateSv: p.convRateSv,
      cumulativeFb: p.fb,
      cumulativeConvRateFb: p.convRateFb,
      cumulativeSc: p.sc,
      cumulativeNi: p.ni,
      totalCalls: p.totalCalls,
    })),
    legacy: trajectory.legacy?.map((p) => ({
      ...p,
      cumulativeUniqueLeads: p.leadsCalled,
      cumulativeAnswered: p.leadsPickedUp,
      cumulativePickupRate: p.pickupRate,
      cumulativePsv: p.psv,
      cumulativeConvRatePsv: p.convRatePsv,
      cumulativeSv: p.sv,
      cumulativeConvRateSv: p.convRateSv,
      cumulativeFb: p.fb,
      cumulativeConvRateFb: p.convRateFb,
      cumulativeSc: p.sc,
      cumulativeNi: p.ni,
      totalCalls: p.totalCalls,
    })) ?? null,
  };
}

export default function Dashboard() {
  const { kioskMode } = useTheme();
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<string>('');
  const [drilldownData, setDrilldownData] = useState<DayDrilldownData | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const resp = await fetch('/api/insights');
        if (!resp.ok) throw new Error(`API error: ${resp.status}`);
        const json = await resp.json();
        setData(json);

        const healthResp = await fetch('/api/health');
        if (healthResp.ok) {
          const health = await healthResp.json();
          setLastRefresh(health.lastRefresh || new Date().toISOString());
        }
      } catch (err) {
        setError(String(err));
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleDayClick = useCallback((day: number) => {
    if (!data) return;

    // Find T7 (trajectory) data for that day
    const lTraj = data.trajectory.landmark.find((p) => p.day === day);
    const bTraj = data.trajectory.broadway.find((p) => p.day === day);
    const legTraj = data.trajectory.legacy?.find((p) => p.day === day);

    // Find T1 (drill-down) data for that day
    const lDrill = data.dayDrilldown?.landmark?.[day];
    const bDrill = data.dayDrilldown?.broadway?.[day];
    const legDrill = data.dayDrilldown?.legacy?.[day];

    // Helper: compute day-level deltas from cumulative T7 trajectory
    // This avoids the bug where cumulative T7 data was mixed with day-level T1 data
    const dayDelta = (traj: typeof data.trajectory.landmark, d: number, field: 'leadsCalled' | 'leadsPickedUp' | 'totalCalls' | 'psv' | 'sv' | 'fb' | 'sc') => {
      const curr = traj.find((p) => p.day === d);
      const prev = traj.find((p) => p.day === d - 1);
      if (!curr) return 0;
      const currVal = (curr as unknown as Record<string, number>)[field] ?? 0;
      const prevVal = prev ? ((prev as unknown as Record<string, number>)[field] ?? 0) : 0;
      return Math.max(0, currVal - prevVal);
    };

    const buildDrilldown = (
      drill: DayDrilldownApiMetrics | undefined,
      traj: typeof data.trajectory.landmark,
      trajPoint: typeof lTraj
    ) => {
      if (!trajPoint) return null;
      // Prefer T1 day-level data; fall back to T7 day-level deltas (not cumulative)
      const firstCall = drill?.firstCallLeads ?? dayDelta(traj, day, 'leadsCalled');
      const answered = drill?.answeredCalls ?? dayDelta(traj, day, 'leadsPickedUp');
      const calls = drill?.totalCalls ?? dayDelta(traj, day, 'totalCalls');
      return {
        totalCalls: calls,
        answeredCalls: Math.min(answered, firstCall || Infinity), // safety: answered cannot exceed leads called
        firstCallLeads: firstCall,
        pickupRate: drill?.pickupRate ?? (firstCall > 0 ? answered / firstCall : trajPoint.pickupRate ?? 0),
        psvLeads: drill?.psvLeads ?? dayDelta(traj, day, 'psv'),
        psvRate: drill?.psvRate ?? trajPoint.convRatePsv ?? 0,
        cumulativeFb: trajPoint.fb ?? 0,
        cumulativeSc: trajPoint.sc ?? 0,
      };
    };

    // Day-level NRI/India split from dayNri data
    const bNri = data.dayNri?.broadway?.[day];
    const lNri = data.dayNri?.landmark?.[day];

    setDrilldownData({
      day,
      broadway: buildDrilldown(bDrill, data.trajectory.broadway, bTraj),
      landmark: buildDrilldown(lDrill, data.trajectory.landmark, lTraj),
      legacy: buildDrilldown(legDrill, data.trajectory.legacy || [], legTraj),
      nriSplit: (bNri || lNri) ? {
        broadway: bNri ? {
          indiaLeads: bNri.indiaLeads,
          nriLeads: bNri.nriLeads,
          indiaConnectionRate: bNri.indiaConnectionRate,
          nriConnectionRate: bNri.nriConnectionRate,
        } : null,
        landmark: lNri ? {
          indiaLeads: lNri.indiaLeads,
          nriLeads: lNri.nriLeads,
          indiaConnectionRate: lNri.indiaConnectionRate,
          nriConnectionRate: lNri.nriConnectionRate,
        } : null,
      } : undefined,
    });
  }, [data]);

  // ---- Loading state ----
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-root)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 rounded-full animate-ping" style={{ background: 'var(--accent)', opacity: 0.15 }} />
            <div className="absolute inset-2 rounded-full animate-pulse" style={{ background: 'var(--accent)', opacity: 0.3 }} />
          </div>
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Analyzing benchmark data...</p>
        </div>
      </div>
    );
  }

  // ---- Error state ----
  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg-root)' }}>
        <div className="max-w-md text-center p-8 rounded-lg" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--critical)' }}>Unable to load dashboard</h2>
          <p className="text-sm mb-4" style={{ color: 'var(--text-tertiary)' }}>{error || 'No data available.'}</p>
          <p className="text-xs" style={{ color: 'var(--text-disabled)' }}>
            Place benchmark CSVs in{' '}
            <code className="font-mono px-1.5 py-0.5 rounded text-xs" style={{ background: 'var(--bg-hover)', color: 'var(--accent)' }}>data/benchmark/</code>
          </p>
        </div>
      </div>
    );
  }

  const positiveInsights = data.insights.filter((i) => i.category === 'positive');
  const actionInsights = data.insights.filter((i) => i.category !== 'positive');
  const healthCards = buildHealthCards(data.pacing, data.mode);
  const trajectoryData = buildTrajectoryData(data.trajectory);

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-root)' }}>
      <Header
        mode={data.mode}
        currentCampaignDay={data.currentCampaignDay}
        lastRefresh={lastRefresh}
        landmarkDays={data.pacing.landmark.latestDay}
        broadwayDays={data.pacing.broadway.latestDay}
      />

      <main
        className="mx-auto py-8"
        style={{
          maxWidth: kioskMode ? '100%' : '1400px',
          padding: kioskMode ? '2rem 2.5rem' : '2rem 1.5rem',
          fontSize: kioskMode ? '105%' : undefined,
        }}
      >

        {/* ============================================================
            SECTION 1: INSIGHTS — what's working + actions
            The primary content layer for executive understanding
            ============================================================ */}

        {/* 1a: What's Working */}
        {positiveInsights.length > 0 && (
          <div className="mb-12">
            <h2
              className="text-xs font-semibold uppercase tracking-widest mb-4"
              style={{ color: 'var(--positive)', letterSpacing: '0.1em' }}
            >
              What&apos;s Working
            </h2>
            <div className="space-y-3">
              {positiveInsights.map((insight, i) => (
                <InsightCard key={insight.id} insight={insight} index={i} />
              ))}
            </div>
          </div>
        )}

        {/* 1b: Actions & Warnings */}
        {actionInsights.length > 0 && (
          <div className="mb-16">
            <h2
              className="text-xs font-semibold uppercase tracking-widest mb-4"
              style={{ color: 'var(--warning)', letterSpacing: '0.1em' }}
            >
              Insights & Actions
            </h2>
            <div className="space-y-3">
              {actionInsights.map((insight, i) => (
                <InsightCard key={insight.id} insight={insight} index={i} />
              ))}
            </div>
          </div>
        )}

        {/* ============================================================
            SECTION 2: EXECUTIVE HEALTH CARDS
            Quick executive-level health check with TBU placeholders
            ============================================================ */}
        <div className="mb-8">
          <ExecutiveHealthCards metrics={healthCards} mode={data.mode} />
        </div>

        {/* ============================================================
            SECTION 3: CAMPAIGN TRAJECTORY
            Multi-tab interactive graph with drill-down
            ============================================================ */}
        <div className="mb-16">
          <CampaignTrajectory
            landmark={trajectoryData.landmark}
            broadway={trajectoryData.broadway}
            legacy={trajectoryData.legacy}
            onDayClick={handleDayClick}
          />
        </div>

        {/* ============================================================
            SECTION 4: EVIDENCE — supporting charts
            Only charts that back the insights above
            ============================================================ */}
        <div className="mb-16">
          <h2
            className="text-xs font-semibold uppercase tracking-widest mb-5"
            style={{ color: 'var(--text-disabled)', letterSpacing: '0.1em' }}
          >
            Evidence
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {data.velocity.landmark.length > 0 && (
              <VelocityChart
                landmark={data.velocity.landmark}
                broadway={data.velocity.broadway}
                legacy={data.velocity.legacy}
                metric="fb"
                title={data.insights.find((i) => i.sourceTable === 'T7')?.headline || 'Campaign progress — cumulative units booked'}
              />
            )}
            {data.scoreBuckets.length > 0 && (
              <ScoreBucketChart
                data={data.scoreBuckets}
                title={data.insights.find((i) => i.sourceTable === 'T3')?.headline || 'Score bucket efficiency'}
              />
            )}
            {data.callingPatterns.landmark.length > 0 && (
              <CallingPatternChart
                landmark={data.callingPatterns.landmark}
                broadway={data.callingPatterns.broadway}
                title={data.insights.find((i) => i.sourceTable === 'T1')?.headline || 'Calling patterns by time slot'}
              />
            )}
            {data.handoffs.landmark.weeklyTrend.length > 0 && (
              <HandoffChart
                landmark={data.handoffs.landmark.weeklyTrend}
                broadway={data.handoffs.broadway.weeklyTrend}
                title={data.insights.find((i) => i.sourceTable === 'T5')?.headline || 'Visit follow-through trend'}
              />
            )}
          </div>
        </div>

        {/* ============================================================
            SECTION 5: SUGGESTIONS
            IF/THEN actionable cards at the bottom
            ============================================================ */}
        <SuggestionBoard suggestions={data.suggestions} />

        {/* ============================================================
            SECTION 6: EXECUTIVE PERFORMANCE BINS (Beta)
            Collapsible section with agent rating analysis
            ============================================================ */}
        {data.execBins && data.execBins.length > 0 && (
          <ExecPerformanceBins data={data.execBins} />
        )}
      </main>

      <Footer />

      {/* Day drill-down modal */}
      <DayDrilldownModal
        data={drilldownData}
        onClose={() => setDrilldownData(null)}
      />
    </div>
  );
}
