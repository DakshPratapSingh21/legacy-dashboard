// ============================================================
// Statistical Engine — z-tests, decomposition, pacing math
// ALL STATISTICAL JARGON STAYS IN THIS FILE
// ============================================================

import type {
  LoadedData,
  T1CallingMetrics,
  T3ScoreThreshold,
  T4PresalesPerformance,
  T5HandoffQuality,
  T7CampaignVelocity,
  HealthPulseData,
} from './types';
import { PROJECTS, Z_SCORE_THRESHOLD, MIN_SAMPLE_SIZE } from './constants';

// ---- Statistical primitives ----

interface ProportionTestResult {
  zScore: number;
  pValue: number;
  significant: boolean;
  delta: number;
  relativeDelta: number;
}

function proportionZTest(
  successes1: number,
  n1: number,
  successes2: number,
  n2: number
): ProportionTestResult {
  if (n1 < MIN_SAMPLE_SIZE || n2 < MIN_SAMPLE_SIZE) {
    return { zScore: 0, pValue: 1, significant: false, delta: 0, relativeDelta: 0 };
  }

  const p1 = successes1 / n1;
  const p2 = successes2 / n2;
  const pPooled = (successes1 + successes2) / (n1 + n2);
  const se = Math.sqrt(pPooled * (1 - pPooled) * (1 / n1 + 1 / n2));

  if (se === 0) {
    return { zScore: 0, pValue: 1, significant: false, delta: 0, relativeDelta: 0 };
  }

  const z = (p1 - p2) / se;
  // Two-tailed approximate p-value using normal approximation
  const pValue = 2 * (1 - normalCDF(Math.abs(z)));
  const delta = p1 - p2;
  const relativeDelta = p2 !== 0 ? (p1 - p2) / p2 : 0;

  return {
    zScore: z,
    pValue,
    significant: Math.abs(z) > Z_SCORE_THRESHOLD,
    delta,
    relativeDelta,
  };
}

function normalCDF(x: number): number {
  // Abramowitz and Stegun approximation
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x);
  const t = 1.0 / (1.0 + p * absX);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX / 2);
  return 0.5 * (1.0 + sign * y);
}

export function weightedAverage(values: number[], weights: number[]): number {
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  if (totalWeight === 0) return 0;
  const sum = values.reduce((acc, v, i) => acc + v * weights[i], 0);
  return sum / totalWeight;
}

// ---- Segment comparison ----

export interface SegmentComparison {
  segment: string;
  project1: string;
  project2: string;
  metric: string;
  value1: number;
  value2: number;
  delta: number;
  relativeDelta: number;
  significant: boolean;
  sampleSize1: number;
  sampleSize2: number;
}

function compareT1Segments(
  data1: T1CallingMetrics[],
  data2: T1CallingMetrics[],
  project1: string,
  project2: string,
  maxDay: number
): SegmentComparison[] {
  const results: SegmentComparison[] = [];

  // Group by score_bucket × lead_type × time_slot
  const agg1 = aggregateT1ByGroup(data1.filter((r) => r.campaign_day <= maxDay));
  const agg2 = aggregateT1ByGroup(data2.filter((r) => r.campaign_day <= maxDay));

  const allKeys = new Set([...Object.keys(agg1), ...Object.keys(agg2)]);

  for (const key of allKeys) {
    const g1 = agg1[key];
    const g2 = agg2[key];
    if (!g1 || !g2) continue;

    // Pickup rate comparison
    const pickupTest = proportionZTest(
      g1.answeredCalls, g1.totalCalls,
      g2.answeredCalls, g2.totalCalls
    );
    if (g1.totalCalls >= MIN_SAMPLE_SIZE && g2.totalCalls >= MIN_SAMPLE_SIZE) {
      results.push({
        segment: key,
        project1,
        project2,
        metric: 'call_pickup_rate',
        value1: g1.totalCalls > 0 ? g1.answeredCalls / g1.totalCalls : 0,
        value2: g2.totalCalls > 0 ? g2.answeredCalls / g2.totalCalls : 0,
        delta: pickupTest.delta,
        relativeDelta: pickupTest.relativeDelta,
        significant: pickupTest.significant,
        sampleSize1: g1.totalCalls,
        sampleSize2: g2.totalCalls,
      });
    }

    // PSV conversion rate comparison
    const psvTest = proportionZTest(
      g1.leadsReachedPsv, g1.firstCallLeads,
      g2.leadsReachedPsv, g2.firstCallLeads
    );
    if (g1.firstCallLeads >= MIN_SAMPLE_SIZE && g2.firstCallLeads >= MIN_SAMPLE_SIZE) {
      results.push({
        segment: key,
        project1,
        project2,
        metric: 'conv_rate_psv',
        value1: g1.firstCallLeads > 0 ? g1.leadsReachedPsv / g1.firstCallLeads : 0,
        value2: g2.firstCallLeads > 0 ? g2.leadsReachedPsv / g2.firstCallLeads : 0,
        delta: psvTest.delta,
        relativeDelta: psvTest.relativeDelta,
        significant: psvTest.significant,
        sampleSize1: g1.firstCallLeads,
        sampleSize2: g2.firstCallLeads,
      });
    }

    // FB conversion rate comparison
    const fbTest = proportionZTest(
      g1.leadsReachedFb, g1.firstCallLeads,
      g2.leadsReachedFb, g2.firstCallLeads
    );
    if (g1.firstCallLeads >= MIN_SAMPLE_SIZE && g2.firstCallLeads >= MIN_SAMPLE_SIZE) {
      results.push({
        segment: key,
        project1,
        project2,
        metric: 'conv_rate_fb',
        value1: g1.firstCallLeads > 0 ? g1.leadsReachedFb / g1.firstCallLeads : 0,
        value2: g2.firstCallLeads > 0 ? g2.leadsReachedFb / g2.firstCallLeads : 0,
        delta: fbTest.delta,
        relativeDelta: fbTest.relativeDelta,
        significant: fbTest.significant,
        sampleSize1: g1.firstCallLeads,
        sampleSize2: g2.firstCallLeads,
      });
    }
  }

  return results;
}

interface AggregatedGroup {
  totalCalls: number;
  answeredCalls: number;
  firstCallLeads: number;
  leadsCalled: number;
  leadsReachedPsv: number;
  leadsReachedFb: number;
  leadsReachedNi: number;
  avgCallDuration: number;
  callCount: number;
}

function aggregateT1ByGroup(
  rows: T1CallingMetrics[]
): Record<string, AggregatedGroup> {
  const groups: Record<string, AggregatedGroup> = {};

  for (const r of rows) {
    const key = `${r.score_bucket}|${r.lead_type}|${r.time_slot}`;
    if (!groups[key]) {
      groups[key] = {
        totalCalls: 0,
        answeredCalls: 0,
        firstCallLeads: 0,
        leadsCalled: 0,
        leadsReachedPsv: 0,
        leadsReachedFb: 0,
        leadsReachedNi: 0,
        avgCallDuration: 0,
        callCount: 0,
      };
    }
    const g = groups[key];
    g.totalCalls += r.total_calls || 0;
    g.answeredCalls += r.answered_calls || 0;
    g.firstCallLeads += r.first_call_leads || 0;
    g.leadsCalled += r.leads_called || 0;
    g.leadsReachedPsv += r.leads_reached_psv || 0;
    g.leadsReachedFb += r.leads_reached_fb || 0;
    g.leadsReachedNi += r.leads_reached_ni || 0;
    if (r.avg_call_duration_sec && r.answered_calls) {
      g.avgCallDuration += r.avg_call_duration_sec * r.answered_calls;
      g.callCount += r.answered_calls;
    }
  }

  return groups;
}

// ---- Score bucket analysis (T3) ----

export interface ScoreBucketAnalysis {
  scoreBucket: string;
  project: string;
  fbPer100: number;
  convRatePsv: number;
  convRateFb: number;
  leadsCalled: number;
  avgPickupRate: number;
}

function analyzeScoreBuckets(t3: T3ScoreThreshold[]): ScoreBucketAnalysis[] {
  // Aggregate across weeks for each project × score_bucket
  const groups: Record<string, {
    fbPer100Sum: number;
    psvRateSum: number;
    fbRateSum: number;
    pickupSum: number;
    totalLeads: number;
    count: number;
  }> = {};

  for (const r of t3) {
    const key = `${r.project}|${r.score_bucket_at_call}`;
    if (!groups[key]) {
      groups[key] = { fbPer100Sum: 0, psvRateSum: 0, fbRateSum: 0, pickupSum: 0, totalLeads: 0, count: 0 };
    }
    const g = groups[key];
    g.fbPer100Sum += (r.fb_per_100_leads_called || 0) * (r.leads_called || 0);
    g.psvRateSum += (r.conv_rate_psv || 0) * (r.leads_called || 0);
    g.fbRateSum += (r.conv_rate_fb || 0) * (r.leads_called || 0);
    g.pickupSum += (r.avg_lead_pickup_rate || 0) * (r.leads_called || 0);
    g.totalLeads += r.leads_called || 0;
    g.count++;
  }

  return Object.entries(groups).map(([key, g]) => {
    const [project, scoreBucket] = key.split('|');
    return {
      scoreBucket,
      project,
      fbPer100: g.totalLeads > 0 ? g.fbPer100Sum / g.totalLeads : 0,
      convRatePsv: g.totalLeads > 0 ? g.psvRateSum / g.totalLeads : 0,
      convRateFb: g.totalLeads > 0 ? g.fbRateSum / g.totalLeads : 0,
      leadsCalled: g.totalLeads,
      avgPickupRate: g.totalLeads > 0 ? g.pickupSum / g.totalLeads : 0,
    };
  });
}

// ---- Handoff analysis (T5) ----

export interface HandoffAnalysis {
  project: string;
  avgHandoffRate: number;
  avgDropRate: number;
  avgDaysPsvToSv: number;
  totalPsvLeads: number;
  totalNeverFollowedUp: number;
  weeklyTrend: { week: number; rate: number }[];
}

function analyzeHandoffs(t5: T5HandoffQuality[], project: string): HandoffAnalysis {
  const projectRows = t5.filter((r) => r.project === project);
  const totalPsv = projectRows.reduce((s, r) => s + (r.leads_reached_psv || 0), 0);
  const totalSv = projectRows.reduce((s, r) => s + (r.leads_converted_sv || 0), 0);
  const totalDropped = projectRows.reduce((s, r) => s + (r.leads_dropped_after_psv || 0), 0);
  const totalNeverFollowed = projectRows.reduce((s, r) => s + (r.leads_never_followed_up || 0), 0);

  // Weighted average days PSV to SV
  const daysPsvSvWeighted = projectRows.reduce(
    (s, r) => s + (r.avg_days_psv_to_sv || 0) * (r.leads_converted_sv || 0), 0
  );

  // Weekly trend
  const weekMap = new Map<number, { psv: number; sv: number }>();
  for (const r of projectRows) {
    const existing = weekMap.get(r.campaign_week) || { psv: 0, sv: 0 };
    existing.psv += r.leads_reached_psv || 0;
    existing.sv += r.leads_converted_sv || 0;
    weekMap.set(r.campaign_week, existing);
  }
  const weeklyTrend = Array.from(weekMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([week, data]) => ({
      week,
      rate: data.psv > 0 ? data.sv / data.psv : 0,
    }));

  return {
    project,
    avgHandoffRate: totalPsv > 0 ? totalSv / totalPsv : 0,
    avgDropRate: totalPsv > 0 ? totalDropped / totalPsv : 0,
    avgDaysPsvToSv: totalSv > 0 ? daysPsvSvWeighted / totalSv : 0,
    totalPsvLeads: totalPsv,
    totalNeverFollowedUp: totalNeverFollowed,
    weeklyTrend,
  };
}

// ---- Pacing analysis (T7) ----

export interface TrajectoryPoint {
  day: number;
  fb: number;
  psv: number;
  sv: number;
  sc: number;
  ni: number;
  leadsCalled: number;
  leadsPickedUp: number;
  pickupRate: number;
  convRatePsv: number;
  convRateSv: number;
  convRateFb: number;
  totalCalls: number;
}

export interface PacingAnalysis {
  project: string;
  latestDay: number;
  cumulativeFb: number;
  cumulativeSc: number;
  cumulativePsv: number;
  cumulativeSv: number;
  cumulativeLeadsCalled: number;
  cumulativePickupRate: number;
  projectedFb60: number | null;
  projectedFb90: number | null;
  trajectory: TrajectoryPoint[];
}

function analyzePacing(t7: T7CampaignVelocity[], project: string): PacingAnalysis {
  const rows = t7.filter((r) => r.project === project).sort((a, b) => a.campaign_day - b.campaign_day);
  const latest = rows[rows.length - 1];

  return {
    project,
    latestDay: latest?.campaign_day || 0,
    cumulativeFb: latest?.cumulative_fb || 0,
    cumulativeSc: latest?.cumulative_sc || 0,
    cumulativePsv: latest?.cumulative_psv || 0,
    cumulativeSv: latest?.cumulative_sv || 0,
    cumulativeLeadsCalled: latest?.cumulative_leads_called || 0,
    cumulativePickupRate: latest?.cumulative_lead_pickup_rate || 0,
    projectedFb60: latest?.projected_fb_at_day60 || null,
    projectedFb90: latest?.projected_fb_at_day90 || null,
    trajectory: rows.map((r) => ({
      day: r.campaign_day,
      fb: r.cumulative_fb || 0,
      psv: r.cumulative_psv || 0,
      sv: r.cumulative_sv || 0,
      sc: r.cumulative_sc || 0,
      ni: r.cumulative_ni || 0,
      leadsCalled: r.cumulative_leads_called || 0,
      leadsPickedUp: r.cumulative_leads_picked_up || 0,
      pickupRate: r.cumulative_lead_pickup_rate || 0,
      convRatePsv: r.cumulative_conv_rate_psv || 0,
      convRateSv: r.cumulative_conv_rate_sv || 0,
      convRateFb: r.cumulative_conv_rate_fb || 0,
      totalCalls: r.cumulative_leads_called || 0, // best proxy from T7
    })),
  };
}

// ---- Decomposition engine ----

export interface DecompositionResult {
  metric: string;
  totalDelta: number;
  mixEffect: number;       // calling different segments
  rateEffect: number;      // converting differently within same segments
  volumeEffect: number;    // different total volume
  dominantFactor: 'mix' | 'rate' | 'volume';
}

function decomposePerformanceGap(
  data1: T1CallingMetrics[],
  data2: T1CallingMetrics[],
  metric: 'conv_rate_psv' | 'conv_rate_fb' | 'call_pickup_rate'
): DecompositionResult {
  const agg1 = aggregateT1ByGroup(data1);
  const agg2 = aggregateT1ByGroup(data2);

  const allKeys = new Set([...Object.keys(agg1), ...Object.keys(agg2)]);

  let totalLeads1 = 0;
  let totalLeads2 = 0;
  for (const g of Object.values(agg1)) totalLeads1 += g.firstCallLeads;
  for (const g of Object.values(agg2)) totalLeads2 += g.firstCallLeads;

  let mixEffect = 0;
  let rateEffect = 0;

  for (const key of allKeys) {
    const g1 = agg1[key];
    const g2 = agg2[key];

    const getRate = (g: AggregatedGroup): number => {
      if (metric === 'call_pickup_rate') return g.totalCalls > 0 ? g.answeredCalls / g.totalCalls : 0;
      if (metric === 'conv_rate_psv') return g.firstCallLeads > 0 ? g.leadsReachedPsv / g.firstCallLeads : 0;
      return g.firstCallLeads > 0 ? g.leadsReachedFb / g.firstCallLeads : 0;
    };

    const share1 = g1 && totalLeads1 > 0 ? g1.firstCallLeads / totalLeads1 : 0;
    const share2 = g2 && totalLeads2 > 0 ? g2.firstCallLeads / totalLeads2 : 0;
    const rate1 = g1 ? getRate(g1) : 0;
    const rate2 = g2 ? getRate(g2) : 0;

    // Kitagawa-Oaxaca-Blinder decomposition
    const avgRate = (rate1 + rate2) / 2;
    const avgShare = (share1 + share2) / 2;

    mixEffect += avgRate * (share1 - share2);
    rateEffect += avgShare * (rate1 - rate2);
  }

  const volumeEffect = totalLeads1 > 0 && totalLeads2 > 0
    ? (totalLeads1 - totalLeads2) / totalLeads2
    : 0;

  const totalDelta = mixEffect + rateEffect;
  const absMix = Math.abs(mixEffect);
  const absRate = Math.abs(rateEffect);
  const absVol = Math.abs(volumeEffect);

  let dominantFactor: 'mix' | 'rate' | 'volume' = 'rate';
  if (absMix > absRate && absMix > absVol) dominantFactor = 'mix';
  else if (absVol > absRate && absVol > absMix) dominantFactor = 'volume';

  return { metric, totalDelta, mixEffect, rateEffect, volumeEffect, dominantFactor };
}

// ---- Calling pattern analysis ----

export interface CallingPatternResult {
  timeSlot: string;
  project: string;
  pickupRate: number;        // per-call pickup = answered / totalCalls
  leadPickupRate: number;    // per-lead connection = weighted avg of lead_pickup_rate
  volumeShare: number;       // share of total leads in this slot
  convRatePsv: number;
  totalCalls: number;
  firstCallLeads: number;
}

function analyzeCallingPatterns(t1: T1CallingMetrics[], project: string): CallingPatternResult[] {
  const groups: Record<string, { totalCalls: number; answered: number; firstCall: number; psv: number; leadPickupWeighted: number }> = {};

  const rows = t1.filter((r) => r.project === project);
  for (const r of rows) {
    const slot = r.time_slot;
    if (!groups[slot]) groups[slot] = { totalCalls: 0, answered: 0, firstCall: 0, psv: 0, leadPickupWeighted: 0 };
    groups[slot].totalCalls += r.total_calls || 0;
    groups[slot].answered += r.answered_calls || 0;
    groups[slot].firstCall += r.first_call_leads || 0;
    groups[slot].psv += r.leads_reached_psv || 0;
    groups[slot].leadPickupWeighted += (r.lead_pickup_rate || 0) * (r.first_call_leads || 0);
  }

  const totalLeads = Object.values(groups).reduce((s, g) => s + g.firstCall, 0);

  return Object.entries(groups).map(([slot, g]) => ({
    timeSlot: slot,
    project,
    pickupRate: g.totalCalls > 0 ? g.answered / g.totalCalls : 0,
    leadPickupRate: g.firstCall > 0 ? g.leadPickupWeighted / g.firstCall : 0,
    volumeShare: totalLeads > 0 ? g.firstCall / totalLeads : 0,
    convRatePsv: g.firstCall > 0 ? g.psv / g.firstCall : 0,
    totalCalls: g.totalCalls,
    firstCallLeads: g.firstCall,
  }));
}

// ---- Per-day drill-down metrics from T1 (using first_call_leads) ----

export interface DayDrilldownMetrics {
  day: number;
  project: string;
  totalCalls: number;
  answeredCalls: number;
  firstCallLeads: number;
  pickupRate: number;
  psvLeads: number;
  psvRate: number;
}

function computeDayDrilldownMetrics(
  t1: T1CallingMetrics[],
  project: string
): Map<number, DayDrilldownMetrics> {
  const dayMap = new Map<number, {
    totalCalls: number;
    answered: number;
    firstCall: number;
    psv: number;
  }>();

  const rows = t1.filter((r) => r.project === project);
  for (const r of rows) {
    const day = r.campaign_day;
    const existing = dayMap.get(day) || { totalCalls: 0, answered: 0, firstCall: 0, psv: 0 };
    existing.totalCalls += r.total_calls || 0;
    existing.answered += r.answered_calls || 0;
    existing.firstCall += r.first_call_leads || 0;
    existing.psv += r.leads_reached_psv || 0;
    dayMap.set(day, existing);
  }

  const result = new Map<number, DayDrilldownMetrics>();
  for (const [day, g] of dayMap) {
    result.set(day, {
      day,
      project,
      totalCalls: g.totalCalls,
      answeredCalls: g.answered,
      firstCallLeads: g.firstCall,
      pickupRate: g.totalCalls > 0 ? g.answered / g.totalCalls : 0,
      psvLeads: g.psv,
      psvRate: g.firstCall > 0 ? g.psv / g.firstCall : 0,
    });
  }
  return result;
}

// ---- Day-level NRI/India split from T1 ----

export interface DayNriSplit {
  indiaLeads: number;
  nriLeads: number;
  indiaCalls: number;
  nriCalls: number;
  indiaAnswered: number;
  nriAnswered: number;
  indiaConnectionRate: number;
  nriConnectionRate: number;
}

function computeDayNriSplits(
  t1: T1CallingMetrics[],
  project: string
): Map<number, DayNriSplit> {
  const dayMap = new Map<number, {
    indiaLeads: number; nriLeads: number;
    indiaCalls: number; nriCalls: number;
    indiaAnswered: number; nriAnswered: number;
  }>();

  const rows = t1.filter((r) => r.project === project);
  for (const r of rows) {
    const day = r.campaign_day;
    const existing = dayMap.get(day) || {
      indiaLeads: 0, nriLeads: 0,
      indiaCalls: 0, nriCalls: 0,
      indiaAnswered: 0, nriAnswered: 0,
    };
    if (r.is_nri === 'NRI') {
      existing.nriLeads += r.first_call_leads || 0;
      existing.nriCalls += r.total_calls || 0;
      existing.nriAnswered += r.answered_calls || 0;
    } else {
      existing.indiaLeads += r.first_call_leads || 0;
      existing.indiaCalls += r.total_calls || 0;
      existing.indiaAnswered += r.answered_calls || 0;
    }
    dayMap.set(day, existing);
  }

  const result = new Map<number, DayNriSplit>();
  for (const [day, g] of dayMap) {
    result.set(day, {
      ...g,
      indiaConnectionRate: g.indiaCalls > 0 ? g.indiaAnswered / g.indiaCalls : 0,
      nriConnectionRate: g.nriCalls > 0 ? g.nriAnswered / g.nriCalls : 0,
    });
  }
  return result;
}

// ---- Main analysis orchestrator ----

// ---- NRI vs India calling pattern analysis ----

export interface NriCallingPattern {
  nriStatus: string;  // 'India' | 'NRI'
  timeSlot: string;
  project: string;
  totalCalls: number;
  answeredCalls: number;
  firstCallLeads: number;
  pickupRate: number;        // per-call pickup
  leadPickupRate: number;    // per-lead connection (volume-weighted)
  convRatePsv: number;
  fbLeads: number;
  bookingRate: number;
}

function analyzeNriCallingPatterns(t1: T1CallingMetrics[], project: string): NriCallingPattern[] {
  const groups: Record<string, { calls: number; answered: number; firstCall: number; psv: number; fb: number; leadPickupWeighted: number }> = {};
  const rows = t1.filter((r) => r.project === project);
  for (const r of rows) {
    const key = `${r.is_nri}|${r.time_slot}`;
    if (!groups[key]) groups[key] = { calls: 0, answered: 0, firstCall: 0, psv: 0, fb: 0, leadPickupWeighted: 0 };
    const g = groups[key];
    g.calls += r.total_calls || 0;
    g.answered += r.answered_calls || 0;
    g.firstCall += r.first_call_leads || 0;
    g.psv += r.leads_reached_psv || 0;
    g.fb += r.leads_reached_fb || 0;
    g.leadPickupWeighted += (r.lead_pickup_rate || 0) * (r.first_call_leads || 0);
  }
  return Object.entries(groups)
    .filter(([, g]) => g.firstCall >= 20)
    .map(([key, g]) => {
      const [nriStatus, timeSlot] = key.split('|');
      return {
        nriStatus,
        timeSlot,
        project,
        totalCalls: g.calls,
        answeredCalls: g.answered,
        firstCallLeads: g.firstCall,
        pickupRate: g.calls > 0 ? g.answered / g.calls : 0,
        leadPickupRate: g.firstCall > 0 ? g.leadPickupWeighted / g.firstCall : 0,
        convRatePsv: g.firstCall > 0 ? g.psv / g.firstCall : 0,
        fbLeads: g.fb,
        bookingRate: g.firstCall > 0 ? g.fb / g.firstCall : 0,
      };
    });
}

// ---- Executive Performance Bin analysis (T4) ----

export interface ExecBinSummary {
  project: string;
  bin: string;
  execCount: number;
  leadsCalledTotal: number;
  answeredTotal: number;
  totalCallsTotal: number;
  psvTotal: number;
  fbTotal: number;
  scTotal: number;
  niTotal: number;
  connectionRate: number;
  visitRate: number;
  bookingRate: number;
  niRate: number;
}

function analyzeExecBins(t4: T4PresalesPerformance[]): ExecBinSummary[] {
  // Find the latest campaign day per project where all 4 performance bins
  // (A, B, C, D) are represented. Late-campaign days often lose bins as
  // agent counts thin out — using a fuller snapshot is more meaningful.
  const REQUIRED_BINS = ['A', 'B', 'C', 'D'];

  // Collect which bins exist at each (project, day) pair
  const binsAtDay: Record<string, Record<number, Set<string>>> = {};
  const allDays: Record<string, number[]> = {};
  for (const r of t4) {
    if (r.performance_bin === 'Insufficient Data' || !r.performance_bin) continue;
    if (!binsAtDay[r.project]) binsAtDay[r.project] = {};
    if (!binsAtDay[r.project][r.campaign_day]) binsAtDay[r.project][r.campaign_day] = new Set();
    binsAtDay[r.project][r.campaign_day].add(r.performance_bin);
  }

  const latestDayPerProject: Record<string, number> = {};
  for (const proj of Object.keys(binsAtDay)) {
    const days = Object.keys(binsAtDay[proj]).map(Number).sort((a, b) => b - a);
    // Pick the latest day with all 4 bins; fall back to absolute latest
    const fullDay = days.find(d => {
      const s = binsAtDay[proj][d];
      return REQUIRED_BINS.every(b => s.has(b));
    });
    latestDayPerProject[proj] = fullDay ?? days[0];
  }

  const groups: Record<string, { execs: Set<string>; leads: number; answered: number; calls: number; psv: number; fb: number; sc: number; ni: number }> = {};

  for (const r of t4) {
    if (r.campaign_day !== latestDayPerProject[r.project]) continue;
    const key = `${r.project}|${r.performance_bin}`;
    if (!groups[key]) groups[key] = { execs: new Set(), leads: 0, answered: 0, calls: 0, psv: 0, fb: 0, sc: 0, ni: 0 };
    const g = groups[key];
    g.execs.add(r.executive_id);
    g.leads += r.leads_called || 0;
    g.calls += r.total_calls || 0;
    g.answered += r.answered_calls || 0;
    g.psv += r.leads_reached_psv || 0;
    g.fb += r.leads_eventually_fb || 0;
    g.sc += r.leads_eventually_sc || 0;
    g.ni += r.leads_reached_ni || 0;
  }

  return Object.entries(groups).map(([key, g]) => {
    const [project, bin] = key.split('|');
    return {
      project,
      bin,
      execCount: g.execs.size,
      leadsCalledTotal: g.leads,
      answeredTotal: g.answered,
      totalCallsTotal: g.calls,
      psvTotal: g.psv,
      fbTotal: g.fb,
      scTotal: g.sc,
      niTotal: g.ni,
      connectionRate: g.calls > 0 ? g.answered / g.calls : 0,
      visitRate: g.leads > 0 ? g.psv / g.leads : 0,
      bookingRate: g.leads > 0 ? g.fb / g.leads : 0,
      niRate: g.leads > 0 ? g.ni / g.leads : 0,
    };
  });
}

export interface AnalysisResults {
  mode: 'demo' | 'live';
  pacingLandmark: PacingAnalysis;
  pacingBroadway: PacingAnalysis;
  pacingLegacy: PacingAnalysis | null;
  scoreBuckets: ScoreBucketAnalysis[];
  handoffLandmark: HandoffAnalysis;
  handoffBroadway: HandoffAnalysis;
  handoffLegacy: HandoffAnalysis | null;
  segmentComparisons: SegmentComparison[];
  callingPatternsLandmark: CallingPatternResult[];
  callingPatternsBroadway: CallingPatternResult[];
  callingPatternsLegacy: CallingPatternResult[] | null;
  decomposition: DecompositionResult[];
  healthPulse: HealthPulseData;
  dayDrilldownLandmark: Map<number, DayDrilldownMetrics>;
  dayDrilldownBroadway: Map<number, DayDrilldownMetrics>;
  dayDrilldownLegacy: Map<number, DayDrilldownMetrics> | null;
  nriPatternsLandmark: NriCallingPattern[];
  nriPatternsBroadway: NriCallingPattern[];
  nriPatternsLegacy: NriCallingPattern[] | null;
  dayNriLandmark: Map<number, DayNriSplit>;
  dayNriBroadway: Map<number, DayNriSplit>;
  dayNriLegacy: Map<number, DayNriSplit> | null;
  execBins: ExecBinSummary[];
}

export function runAnalysis(data: LoadedData): AnalysisResults {
  const { benchmark, legacy, mode } = data;

  // Pacing
  const pacingLandmark = analyzePacing(benchmark.t7, PROJECTS.LANDMARK);
  const pacingBroadway = analyzePacing(benchmark.t7, PROJECTS.BROADWAY);
  const pacingLegacy = legacy?.t7?.length
    ? analyzePacing(legacy.t7, PROJECTS.LEGACY)
    : null;

  // Score buckets (T3)
  const scoreBuckets = analyzeScoreBuckets(benchmark.t3);

  // Handoffs (T5)
  const handoffLandmark = analyzeHandoffs(benchmark.t5, PROJECTS.LANDMARK);
  const handoffBroadway = analyzeHandoffs(benchmark.t5, PROJECTS.BROADWAY);
  const handoffLegacy = legacy?.t5?.length
    ? analyzeHandoffs(legacy.t5, PROJECTS.LEGACY)
    : null;

  // Calling patterns
  const callingPatternsLandmark = analyzeCallingPatterns(benchmark.t1, PROJECTS.LANDMARK);
  const callingPatternsBroadway = analyzeCallingPatterns(benchmark.t1, PROJECTS.BROADWAY);
  const callingPatternsLegacy = legacy?.t1?.length
    ? analyzeCallingPatterns(legacy.t1, PROJECTS.LEGACY)
    : null;

  // Segment comparisons
  const minDay = Math.min(pacingLandmark.latestDay, pacingBroadway.latestDay);
  const landmarkT1 = benchmark.t1.filter((r) => r.project === PROJECTS.LANDMARK);
  const broadwayT1 = benchmark.t1.filter((r) => r.project === PROJECTS.BROADWAY);

  let segmentComparisons: SegmentComparison[];
  if (mode === 'demo') {
    segmentComparisons = compareT1Segments(
      landmarkT1, broadwayT1, PROJECTS.LANDMARK, PROJECTS.BROADWAY, minDay
    );
  } else {
    const legacyT1 = legacy?.t1 || [];
    const legacyDay = pacingLegacy?.latestDay || minDay;
    segmentComparisons = [
      ...compareT1Segments(legacyT1, landmarkT1, PROJECTS.LEGACY, PROJECTS.LANDMARK, legacyDay),
      ...compareT1Segments(legacyT1, broadwayT1, PROJECTS.LEGACY, PROJECTS.BROADWAY, legacyDay),
    ];
  }

  // Day-level drill-down metrics (using first_call_leads as unique lead denominator)
  const dayDrilldownLandmark = computeDayDrilldownMetrics(benchmark.t1, PROJECTS.LANDMARK);
  const dayDrilldownBroadway = computeDayDrilldownMetrics(benchmark.t1, PROJECTS.BROADWAY);
  const dayDrilldownLegacy = legacy?.t1?.length
    ? computeDayDrilldownMetrics(legacy.t1, PROJECTS.LEGACY)
    : null;

  // NRI calling patterns (overall for insights)
  const nriPatternsLandmark = analyzeNriCallingPatterns(benchmark.t1, PROJECTS.LANDMARK);
  const nriPatternsBroadway = analyzeNriCallingPatterns(benchmark.t1, PROJECTS.BROADWAY);
  const nriPatternsLegacy = legacy?.t1?.length
    ? analyzeNriCallingPatterns(legacy.t1, PROJECTS.LEGACY)
    : null;

  // Day-level NRI splits (for drill-down modal)
  const dayNriLandmark = computeDayNriSplits(benchmark.t1, PROJECTS.LANDMARK);
  const dayNriBroadway = computeDayNriSplits(benchmark.t1, PROJECTS.BROADWAY);
  const dayNriLegacy = legacy?.t1?.length
    ? computeDayNriSplits(legacy.t1, PROJECTS.LEGACY)
    : null;

  // Executive performance bins (T4)
  const allT4 = [...(benchmark.t4 || []), ...(legacy?.t4 || [])];
  const execBins = allT4.length > 0 ? analyzeExecBins(allT4) : [];

  // Decomposition
  const decomposition: DecompositionResult[] = [];
  if (mode === 'demo') {
    decomposition.push(
      decomposePerformanceGap(landmarkT1, broadwayT1, 'conv_rate_psv'),
      decomposePerformanceGap(landmarkT1, broadwayT1, 'call_pickup_rate')
    );
  }

  // Health pulse
  const healthPulse = computeHealthPulse(
    pacingLandmark, pacingBroadway, pacingLegacy,
    handoffLandmark, handoffBroadway, handoffLegacy,
    callingPatternsLandmark, callingPatternsBroadway, callingPatternsLegacy,
    mode
  );

  return {
    mode,
    pacingLandmark,
    pacingBroadway,
    pacingLegacy,
    scoreBuckets,
    handoffLandmark,
    handoffBroadway,
    handoffLegacy,
    segmentComparisons,
    callingPatternsLandmark,
    callingPatternsBroadway,
    callingPatternsLegacy,
    decomposition,
    healthPulse,
    dayDrilldownLandmark,
    dayDrilldownBroadway,
    dayDrilldownLegacy,
    nriPatternsLandmark,
    nriPatternsBroadway,
    nriPatternsLegacy,
    dayNriLandmark,
    dayNriBroadway,
    dayNriLegacy,
    execBins,
  };
}

function computeHealthPulse(
  pacingL: PacingAnalysis,
  pacingB: PacingAnalysis,
  pacingLeg: PacingAnalysis | null,
  handoffL: HandoffAnalysis,
  handoffB: HandoffAnalysis,
  handoffLeg: HandoffAnalysis | null,
  callingL: CallingPatternResult[],
  callingB: CallingPatternResult[],
  callingLeg: CallingPatternResult[] | null,
  mode: 'demo' | 'live'
): HealthPulseData {
  if (mode === 'live' && pacingLeg) {
    // Live mode: compare Legacy against both benchmarks
    const lFbRate = pacingL.latestDay > 0
      ? pacingL.trajectory.find((t) => t.day === pacingLeg.latestDay)?.fb || pacingL.cumulativeFb
      : 0;
    const bFbRate = pacingB.latestDay > 0
      ? pacingB.trajectory.find((t) => t.day === pacingLeg.latestDay)?.fb || pacingB.cumulativeFb
      : 0;

    const pacingVsL = lFbRate > 0 ? pacingLeg.cumulativeFb / lFbRate : 0;
    const pacingVsB = bFbRate > 0 ? pacingLeg.cumulativeFb / bFbRate : 0;

    return {
      pacing: {
        label: 'Units Booked',
        value: `${pacingLeg.cumulativeFb} booked at Day ${pacingLeg.latestDay}`,
        trend: pacingVsL >= 1 ? 'up' : 'down',
        status: pacingVsL >= 0.8 ? 'good' : pacingVsL >= 0.5 ? 'warning' : 'critical',
        vsLandmark: `${(pacingVsL * 100).toFixed(0)}% of Landmark pace`,
        vsBroadway: `${(pacingVsB * 100).toFixed(0)}% of Broadway pace`,
        detail: `Legacy has ${pacingLeg.cumulativeFb} units booked at campaign day ${pacingLeg.latestDay}`,
      },
      pickup: {
        label: 'Connection Rate',
        value: `${(pacingLeg.cumulativePickupRate * 100).toFixed(1)}%`,
        trend: pacingLeg.cumulativePickupRate >= 0.5 ? 'up' : 'down',
        status: pacingLeg.cumulativePickupRate >= 0.5 ? 'good' : pacingLeg.cumulativePickupRate >= 0.35 ? 'warning' : 'critical',
        vsLandmark: `${(pacingL.cumulativePickupRate * 100).toFixed(1)}% at same day`,
        vsBroadway: `${(pacingB.cumulativePickupRate * 100).toFixed(1)}% at same day`,
        detail: `${pacingLeg.cumulativeLeadsCalled} unique leads called, ${(pacingLeg.cumulativePickupRate * 100).toFixed(1)}% connected`,
      },
      handoff: {
        label: 'Visit Follow-Through',
        value: handoffLeg ? `${(handoffLeg.avgHandoffRate * 100).toFixed(1)}%` : 'N/A',
        trend: handoffLeg && handoffLeg.avgHandoffRate >= handoffL.avgHandoffRate ? 'up' : 'down',
        status: handoffLeg && handoffLeg.avgHandoffRate >= 0.3 ? 'good' : 'warning',
        vsLandmark: `${(handoffL.avgHandoffRate * 100).toFixed(1)}% overall`,
        vsBroadway: `${(handoffB.avgHandoffRate * 100).toFixed(1)}% overall`,
        detail: handoffLeg
          ? `${handoffLeg.totalPsvLeads} leads scheduled visits, ${(handoffLeg.avgHandoffRate * 100).toFixed(1)}% actually visited`
          : 'No visit follow-through data yet',
      },
    };
  }

  // Demo mode: compare Landmark vs Broadway
  const avgFbL = pacingL.cumulativeFb;
  const avgFbB = pacingB.cumulativeFb;

  // Use per-lead connection rate (volume-weighted), not per-call pickup
  const totalPickupL = callingL.reduce((s, c) => s + c.leadPickupRate * c.firstCallLeads, 0) /
    Math.max(1, callingL.reduce((s, c) => s + c.firstCallLeads, 0));
  const totalPickupB = callingB.reduce((s, c) => s + c.leadPickupRate * c.firstCallLeads, 0) /
    Math.max(1, callingB.reduce((s, c) => s + c.firstCallLeads, 0));

  return {
    pacing: {
      label: 'Units Booked',
      value: `Landmark: ${avgFbL} | Broadway: ${avgFbB}`,
      trend: avgFbL > avgFbB ? 'up' : 'down',
      status: 'good',
      vsLandmark: `${avgFbL} units booked over ${pacingL.latestDay} days`,
      vsBroadway: `${avgFbB} units booked over ${pacingB.latestDay} days`,
      detail: `Landmark booked ${avgFbL} units in ${pacingL.latestDay} days vs Broadway's ${avgFbB} in ${pacingB.latestDay} days`,
    },
    pickup: {
      label: 'Connection Rate',
      value: `L: ${(totalPickupL * 100).toFixed(1)}% | B: ${(totalPickupB * 100).toFixed(1)}%`,
      trend: totalPickupL > totalPickupB ? 'up' : 'stable',
      status: totalPickupL > 0.4 && totalPickupB > 0.4 ? 'good' : 'warning',
      vsLandmark: `${(totalPickupL * 100).toFixed(1)}% overall`,
      vsBroadway: `${(totalPickupB * 100).toFixed(1)}% overall`,
      detail: `Landmark connected with ${(totalPickupL * 100).toFixed(1)}% of leads vs Broadway: ${(totalPickupB * 100).toFixed(1)}%`,
    },
    handoff: {
      label: 'Visit Follow-Through',
      value: `L: ${(handoffL.avgHandoffRate * 100).toFixed(1)}% | B: ${(handoffB.avgHandoffRate * 100).toFixed(1)}%`,
      trend: handoffL.avgHandoffRate > handoffB.avgHandoffRate ? 'up' : 'down',
      status: handoffL.avgHandoffRate > 0.3 && handoffB.avgHandoffRate > 0.3 ? 'good' : 'warning',
      vsLandmark: `${(handoffL.avgHandoffRate * 100).toFixed(1)}% visited after scheduling, ${(handoffL.avgDropRate * 100).toFixed(1)}% dropped`,
      vsBroadway: `${(handoffB.avgHandoffRate * 100).toFixed(1)}% visited after scheduling, ${(handoffB.avgDropRate * 100).toFixed(1)}% dropped`,
      detail: `Landmark got ${(handoffL.avgHandoffRate * 100).toFixed(1)}% of scheduled leads to visit vs Broadway's ${(handoffB.avgHandoffRate * 100).toFixed(1)}%`,
    },
  };
}
