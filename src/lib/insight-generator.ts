// ============================================================
// Insight Generator — converts statistical results to plain English
// Every insight: headline + detail + data trail + action + projected impact
//
// ALL user-facing text is in plain English.
// No jargon: PSV, SV, FB, SC are NEVER shown to users.
// Everything is based on UNIQUE LEADS, not call counts.
// ============================================================

import type {
  Insight,
  SuggestionItem,
  LoadedData,
} from './types';
import type {
  AnalysisResults,
  ScoreBucketAnalysis,
  CallingPatternResult,
  NriCallingPattern,
} from './statistical-engine';
import { REALIZATION_FACTOR, PROJECTS } from './constants';
import { SCORE_BUCKET_LABELS } from './labels';

let insightCounter = 0;
function nextId(): string {
  return `insight-${++insightCounter}`;
}

/** Map raw score bucket key (e.g. "0.1+") to friendly label (e.g. "Very High") */
function bucketLabel(raw: string): string {
  return SCORE_BUCKET_LABELS[raw] || raw;
}

/** Map raw lead type key (e.g. "existing_scored") to friendly label */
function leadTypeLabel(raw: string): string {
  const labels: Record<string, string> = {
    existing_scored: 'scored',
    existing_unscored: 'unscored',
    new: 'new',
  };
  return labels[raw] || raw;
}

/** Map raw time slot key (e.g. "2_Afternoon") to friendly label */
function slotLabel(raw: string): string {
  const labels: Record<string, string> = {
    '1_Morning': 'Morning (6am–12pm)',
    '2_Afternoon': 'Afternoon (12–5pm)',
    '3_Evening': 'Evening (5–9pm)',
    '4_Off Hours': 'Off Hours',
  };
  return labels[raw] || raw.replace(/^\d_/, '');
}

// ---- Demo mode insights (Landmark vs Broadway) ----

function generateDemoInsights(analysis: AnalysisResults): Insight[] {
  insightCounter = 0;
  const insights: Insight[] = [];

  // INSIGHT 1: Score bucket performance divergence (T3)
  const scoreBucketInsight = generateScoreBucketInsight(analysis);
  if (scoreBucketInsight) insights.push(scoreBucketInsight);

  // INSIGHT 2: Calling pattern differences (T1)
  const callingInsight = generateCallingPatternInsight(analysis);
  if (callingInsight) insights.push(callingInsight);

  // INSIGHT 3: Visit follow-through divergence (T5)
  const handoffInsight = generateHandoffInsight(analysis);
  if (handoffInsight) insights.push(handoffInsight);

  // INSIGHT 4: NRI vs India calling pattern (time-of-day matters differently)
  const nriInsight = generateNriInsight(analysis);
  if (nriInsight) insights.push(nriInsight);

  // INSIGHT 5: Pacing trajectory comparison
  const pacingInsight = generatePacingInsight(analysis);
  if (pacingInsight) insights.push(pacingInsight);

  // Additional segment-level insights from significant comparisons
  const segmentInsights = generateSegmentInsights(analysis);
  insights.push(...segmentInsights);

  return insights.sort((a, b) => a.priority - b.priority);
}

function generateScoreBucketInsight(analysis: AnalysisResults): Insight | null {
  const { scoreBuckets } = analysis;
  if (scoreBuckets.length === 0) return null;

  const landmarkBuckets = scoreBuckets.filter((b) => b.project === PROJECTS.LANDMARK);
  const broadwayBuckets = scoreBuckets.filter((b) => b.project === PROJECTS.BROADWAY);

  let bestDelta = 0;
  let bestBucket = '';
  let bestLandmark: ScoreBucketAnalysis | null = null;
  let bestBroadway: ScoreBucketAnalysis | null = null;

  for (const lb of landmarkBuckets) {
    const bb = broadwayBuckets.find((b) => b.scoreBucket === lb.scoreBucket);
    if (!bb) continue;
    const delta = Math.abs(lb.fbPer100 - bb.fbPer100);
    if (delta > bestDelta && lb.leadsCalled > 50 && bb.leadsCalled > 50) {
      bestDelta = delta;
      bestBucket = lb.scoreBucket;
      bestLandmark = lb;
      bestBroadway = bb;
    }
  }

  if (!bestLandmark || !bestBroadway || bestDelta < 0.1) return null;

  const winner = bestLandmark.fbPer100 > bestBroadway.fbPer100 ? 'Landmark' : 'Broadway';
  const winnerVal = Math.max(bestLandmark.fbPer100, bestBroadway.fbPer100);
  const loserVal = Math.min(bestLandmark.fbPer100, bestBroadway.fbPer100);
  const friendlyBucket = bucketLabel(bestBucket);

  // Find overall best-performing bucket
  const allBuckets = [...landmarkBuckets, ...broadwayBuckets].filter(b => b.leadsCalled > 50);
  const topBucket = allBuckets.sort((a, b) => b.fbPer100 - a.fbPer100)[0];

  return {
    id: nextId(),
    category: 'positive',
    headline: `"${friendlyBucket}" quality leads: ${winner} booked ${winnerVal.toFixed(1)} units per 100 leads`,
    detail: `Among "${friendlyBucket}" quality leads, ${winner} booked ${winnerVal.toFixed(1)} units per 100 unique leads — ${((winnerVal - loserVal) / Math.max(loserVal, 0.01) * 100).toFixed(0)}% more than the other campaign's ${loserVal.toFixed(1)}. ${topBucket ? `The best-performing lead quality group overall was "${bucketLabel(topBucket.scoreBucket)}" (${topBucket.project}) with ${topBucket.fbPer100.toFixed(1)} bookings per 100 leads.` : ''}`,
    dataTrail: [
      {
        label: `Landmark — ${friendlyBucket}`,
        value: `${bestLandmark.fbPer100.toFixed(2)} bookings/100`,
        context: `${bestLandmark.leadsCalled} unique leads, ${(bestLandmark.convRatePsv * 100).toFixed(1)}% scheduled a visit`,
      },
      {
        label: `Broadway — ${friendlyBucket}`,
        value: `${bestBroadway.fbPer100.toFixed(2)} bookings/100`,
        context: `${bestBroadway.leadsCalled} unique leads, ${(bestBroadway.convRatePsv * 100).toFixed(1)}% scheduled a visit`,
      },
    ],
    suggestion: `Prioritise "${friendlyBucket}" quality leads for Legacy, following ${winner}'s approach. Their connection rate was ${(Math.max(bestLandmark.avgPickupRate, bestBroadway.avgPickupRate) * 100).toFixed(0)}% in this group.`,
    projectedImpact: {
      metric: 'Bookings per 100 leads',
      currentValue: loserVal,
      projectedValue: loserVal + (winnerVal - loserVal) * REALIZATION_FACTOR,
      confidence: bestDelta > 1 ? 'high' : 'medium',
      basis: `Based on ${winner}'s results with "${friendlyBucket}" leads across ${Math.max(bestLandmark.leadsCalled, bestBroadway.leadsCalled)} unique leads`,
    },
    priority: 1,
    sourceTable: 'T3',
    segment: bestBucket,
  };
}

function generateCallingPatternInsight(analysis: AnalysisResults): Insight | null {
  const { callingPatternsLandmark, callingPatternsBroadway } = analysis;
  if (callingPatternsLandmark.length === 0 || callingPatternsBroadway.length === 0) return null;

  // Use volume-weighted effective connection rate = leadPickupRate × volumeShare
  // This tells us: "which time slot ACTUALLY drives the most connections?"
  // We compare the same slot across campaigns using per-lead connection rate,
  // but only surface slots that carry meaningful volume (>5% of leads).

  let bestSlot = '';
  let bestDelta = 0;
  let bestL: CallingPatternResult | null = null;
  let bestB: CallingPatternResult | null = null;

  for (const lp of callingPatternsLandmark) {
    const bp = callingPatternsBroadway.find((b) => b.timeSlot === lp.timeSlot);
    if (!bp) continue;
    // Use per-lead connection rate, not per-call pickup
    const delta = Math.abs(lp.leadPickupRate - bp.leadPickupRate);
    // Require meaningful volume (>5% share in at least one campaign)
    // AND minimum sample size
    if (delta > bestDelta && lp.firstCallLeads > 100 && bp.firstCallLeads > 100
        && (lp.volumeShare > 0.05 || bp.volumeShare > 0.05)) {
      bestDelta = delta;
      bestSlot = lp.timeSlot;
      bestL = lp;
      bestB = bp;
    }
  }

  if (!bestL || !bestB || bestDelta < 0.02) return null;

  const friendlySlot = slotLabel(bestSlot);
  const winner = bestL.leadPickupRate > bestB.leadPickupRate ? 'Landmark' : 'Broadway';
  const winnerRate = Math.max(bestL.leadPickupRate, bestB.leadPickupRate);
  const loserRate = Math.min(bestL.leadPickupRate, bestB.leadPickupRate);
  const winnerVol = bestL.leadPickupRate > bestB.leadPickupRate ? bestL : bestB;
  const multiplier = winnerRate / Math.max(loserRate, 0.001);

  // Find best slot by effective contribution (rate × volume)
  const allSlots = [...callingPatternsLandmark, ...callingPatternsBroadway]
    .filter(s => s.firstCallLeads > 200);
  const bestOverall = allSlots.sort((a, b) =>
    (b.leadPickupRate * b.volumeShare) - (a.leadPickupRate * a.volumeShare)
  )[0];

  return {
    id: nextId(),
    category: 'suggestion',
    headline: `${friendlySlot}: ${(bestDelta * 100).toFixed(1)} percentage point lead connection gap between campaigns`,
    detail: `${winner} connected with ${(winnerRate * 100).toFixed(1)}% of unique leads during ${friendlySlot} vs ${(loserRate * 100).toFixed(1)}% (${multiplier.toFixed(2)}× multiplier). This slot carried ${(winnerVol.volumeShare * 100).toFixed(0)}% of ${winner}'s total leads (${winnerVol.firstCallLeads.toLocaleString()} leads). ${bestOverall ? `The highest-impact slot overall (rate × volume) was ${slotLabel(bestOverall.timeSlot)} (${bestOverall.project}) — ${(bestOverall.leadPickupRate * 100).toFixed(1)}% connection rate with ${(bestOverall.volumeShare * 100).toFixed(0)}% of leads.` : ''}`,
    dataTrail: [
      {
        label: `Landmark — ${friendlySlot}`,
        value: `${(bestL.leadPickupRate * 100).toFixed(1)}% of leads connected`,
        context: `${bestL.firstCallLeads.toLocaleString()} unique leads (${(bestL.volumeShare * 100).toFixed(0)}% of volume)`,
      },
      {
        label: `Broadway — ${friendlySlot}`,
        value: `${(bestB.leadPickupRate * 100).toFixed(1)}% of leads connected`,
        context: `${bestB.firstCallLeads.toLocaleString()} unique leads (${(bestB.volumeShare * 100).toFixed(0)}% of volume)`,
      },
    ],
    suggestion: `For Legacy, optimise calling during ${friendlySlot} — ${winner}'s ${multiplier.toFixed(2)}× advantage came from ${winnerVol.firstCallLeads.toLocaleString()} leads. Their visit scheduling rate in this slot was ${(Math.max(bestL.convRatePsv, bestB.convRatePsv) * 100).toFixed(1)}%.`,
    projectedImpact: {
      metric: 'Lead connection rate',
      currentValue: loserRate,
      projectedValue: loserRate + bestDelta * REALIZATION_FACTOR,
      confidence: bestDelta > 0.05 && (bestL.volumeShare > 0.1 || bestB.volumeShare > 0.1) ? 'high' : 'medium',
      basis: `${winner} connected ${(winnerRate * 100).toFixed(1)}% of ${winnerVol.firstCallLeads.toLocaleString()} unique leads during ${friendlySlot}`,
    },
    priority: 2,
    sourceTable: 'T1',
    segment: bestSlot,
  };
}

function generateNriInsight(analysis: AnalysisResults): Insight | null {
  const allPatterns = [
    ...analysis.nriPatternsLandmark,
    ...analysis.nriPatternsBroadway,
  ];
  if (allPatterns.length === 0) return null;

  // Find the most striking NRI vs India gap for the same time slot
  // using per-LEAD connection rate (volume-weighted), not per-call pickup
  const nriBySlot: Record<string, NriCallingPattern[]> = {};
  const indiaBySlot: Record<string, NriCallingPattern[]> = {};

  for (const p of allPatterns) {
    const target = p.nriStatus === 'NRI' ? nriBySlot : indiaBySlot;
    if (!target[p.timeSlot]) target[p.timeSlot] = [];
    target[p.timeSlot].push(p);
  }

  let bestSlot = '';
  let bestGap = 0;
  let bestNriRate = 0;
  let bestIndiaRate = 0;
  let bestNriLeads = 0;
  let bestIndiaLeads = 0;

  for (const slot of Object.keys(nriBySlot)) {
    const nriArr = nriBySlot[slot] || [];
    const indiaArr = indiaBySlot[slot] || [];
    if (nriArr.length === 0 || indiaArr.length === 0) continue;

    // Volume-weighted per-lead connection rates
    const nriLeads = nriArr.reduce((s, p) => s + p.firstCallLeads, 0);
    const indiaLeads = indiaArr.reduce((s, p) => s + p.firstCallLeads, 0);
    const nriRate = nriLeads > 0
      ? nriArr.reduce((s, p) => s + p.leadPickupRate * p.firstCallLeads, 0) / nriLeads
      : 0;
    const indiaRate = indiaLeads > 0
      ? indiaArr.reduce((s, p) => s + p.leadPickupRate * p.firstCallLeads, 0) / indiaLeads
      : 0;

    // Require minimum lead volume, not call volume
    if (nriLeads < 50 || indiaLeads < 50) continue;

    const gap = Math.abs(nriRate - indiaRate);

    if (gap > bestGap) {
      bestGap = gap;
      bestSlot = slot;
      bestNriRate = nriRate;
      bestIndiaRate = indiaRate;
      bestNriLeads = nriLeads;
      bestIndiaLeads = indiaLeads;
    }
  }

  if (bestGap < 0.05 || !bestSlot) return null;

  const friendly = slotLabel(bestSlot);

  // Also find NRI best slot and India best slot using per-lead rates
  const nriSlots = Object.entries(nriBySlot).map(([slot, arr]) => {
    const leads = arr.reduce((s, p) => s + p.firstCallLeads, 0);
    const rate = leads > 0 ? arr.reduce((s, p) => s + p.leadPickupRate * p.firstCallLeads, 0) / leads : 0;
    return { slot, rate, leads };
  }).filter(s => s.leads >= 50).sort((a, b) => b.rate - a.rate);

  const indiaSlots = Object.entries(indiaBySlot).map(([slot, arr]) => {
    const leads = arr.reduce((s, p) => s + p.firstCallLeads, 0);
    const rate = leads > 0 ? arr.reduce((s, p) => s + p.leadPickupRate * p.firstCallLeads, 0) / leads : 0;
    return { slot, rate, leads };
  }).filter(s => s.leads >= 50).sort((a, b) => b.rate - a.rate);

  const bestNriSlot = nriSlots[0];
  const bestIndiaSlot = indiaSlots[0];

  return {
    id: nextId(),
    category: 'suggestion',
    headline: `NRI leads connect ${(bestGap * 100).toFixed(0)} percentage points more than India leads during ${friendly}`,
    detail: `During ${friendly}, ${(bestNriRate * 100).toFixed(1)}% of NRI leads were reached vs ${(bestIndiaRate * 100).toFixed(1)}% of India-based leads — a ${(bestGap * 100).toFixed(1)} percentage point gap across ${bestNriLeads.toLocaleString()} NRI and ${bestIndiaLeads.toLocaleString()} India leads. ${bestNriSlot ? `NRI leads connect best during ${slotLabel(bestNriSlot.slot)} (${(bestNriSlot.rate * 100).toFixed(1)}% of ${bestNriSlot.leads.toLocaleString()} leads).` : ''} ${bestIndiaSlot ? `India-based leads connect best during ${slotLabel(bestIndiaSlot.slot)} (${(bestIndiaSlot.rate * 100).toFixed(1)}% of ${bestIndiaSlot.leads.toLocaleString()} leads).` : ''}`,
    dataTrail: [
      {
        label: `NRI — ${friendly}`,
        value: `${(bestNriRate * 100).toFixed(1)}% of leads connected`,
        context: `${bestNriLeads.toLocaleString()} unique leads`,
      },
      {
        label: `India — ${friendly}`,
        value: `${(bestIndiaRate * 100).toFixed(1)}% of leads connected`,
        context: `${bestIndiaLeads.toLocaleString()} unique leads`,
      },
    ],
    suggestion: `Schedule NRI lead calls during ${bestNriSlot ? slotLabel(bestNriSlot.slot) : 'Evening/Off Hours'} and India-based calls during ${bestIndiaSlot ? slotLabel(bestIndiaSlot.slot) : 'Morning'}. This split targets each group's peak connection window.`,
    projectedImpact: {
      metric: 'Lead connection rate',
      currentValue: Math.min(bestNriRate, bestIndiaRate),
      projectedValue: Math.min(bestNriRate, bestIndiaRate) + bestGap * REALIZATION_FACTOR,
      confidence: bestGap > 0.15 ? 'high' : 'medium',
      basis: `Based on ${(bestNriLeads + bestIndiaLeads).toLocaleString()} unique leads across both campaigns`,
    },
    priority: 2,
    sourceTable: 'T1',
    segment: 'NRI vs India',
  };
}

function generateHandoffInsight(analysis: AnalysisResults): Insight | null {
  const { handoffLandmark, handoffBroadway } = analysis;

  const rateDelta = handoffLandmark.avgHandoffRate - handoffBroadway.avgHandoffRate;
  if (Math.abs(rateDelta) < 0.02 && handoffLandmark.totalPsvLeads < 10) return null;

  const better = rateDelta > 0 ? 'Landmark' : 'Broadway';
  const betterH = rateDelta > 0 ? handoffLandmark : handoffBroadway;
  const worseH = rateDelta > 0 ? handoffBroadway : handoffLandmark;
  const worseName = rateDelta > 0 ? 'Broadway' : 'Landmark';

  // Find week with biggest divergence
  const betterWeeks = new Map(betterH.weeklyTrend.map((w) => [w.week, w.rate]));
  let maxWeekDelta = 0;
  let divergenceWeek = 0;
  for (const w of worseH.weeklyTrend) {
    const bRate = betterWeeks.get(w.week);
    if (bRate !== undefined) {
      const d = bRate - w.rate;
      if (d > maxWeekDelta) {
        maxWeekDelta = d;
        divergenceWeek = w.week;
      }
    }
  }

  return {
    id: nextId(),
    category: Math.abs(rateDelta) > 0.1 ? 'warning' : 'suggestion',
    headline: `Visit follow-through: ${better} converted ${(betterH.avgHandoffRate * 100).toFixed(1)}% of scheduled visits into actual visits vs ${worseName}'s ${(worseH.avgHandoffRate * 100).toFixed(1)}%`,
    detail: `${better}'s team got ${(betterH.avgHandoffRate * 100).toFixed(1)}% of leads who scheduled a visit to actually show up, while ${worseName} managed only ${(worseH.avgHandoffRate * 100).toFixed(1)}%. ${worseName} lost ${(worseH.avgDropRate * 100).toFixed(1)}% of scheduled visits (vs ${(betterH.avgDropRate * 100).toFixed(1)}% for ${better}).${divergenceWeek > 0 ? ` The biggest gap appeared in week ${divergenceWeek}.` : ''} ${worseH.totalNeverFollowedUp > 0 ? `${worseName} had ${worseH.totalNeverFollowedUp} leads who scheduled a visit but were never followed up with.` : ''}`,
    dataTrail: [
      {
        label: `${better} — follow-through`,
        value: `${(betterH.avgHandoffRate * 100).toFixed(1)}% visited`,
        context: `${betterH.totalPsvLeads} leads scheduled, avg ${betterH.avgDaysPsvToSv.toFixed(1)} days to visit`,
      },
      {
        label: `${worseName} — follow-through`,
        value: `${(worseH.avgHandoffRate * 100).toFixed(1)}% visited`,
        context: `${worseH.totalPsvLeads} leads scheduled, avg ${worseH.avgDaysPsvToSv.toFixed(1)} days to visit, ${worseH.totalNeverFollowedUp} never followed up`,
      },
    ],
    suggestion: `For Legacy, follow up every scheduled visit within ${Math.max(1, Math.floor(betterH.avgDaysPsvToSv))} days (matching ${better}'s pace). Flag any lead with a scheduled visit and zero follow-up calls after 48 hours.`,
    projectedImpact: {
      metric: 'Visit follow-through rate',
      currentValue: worseH.avgHandoffRate,
      projectedValue: worseH.avgHandoffRate + Math.abs(rateDelta) * REALIZATION_FACTOR,
      confidence: Math.abs(rateDelta) > 0.1 ? 'high' : 'medium',
      basis: `${better} maintained ${(betterH.avgHandoffRate * 100).toFixed(1)}% follow-through across ${betterH.totalPsvLeads} leads who scheduled visits`,
    },
    priority: 3,
    sourceTable: 'T5',
    segment: 'Visit follow-through',
  };
}

function generatePacingInsight(analysis: AnalysisResults): Insight | null {
  const { pacingLandmark, pacingBroadway } = analysis;

  if (pacingLandmark.trajectory.length === 0 || pacingBroadway.trajectory.length === 0) return null;

  const minDay = Math.min(pacingLandmark.latestDay, pacingBroadway.latestDay);
  const milestones = [30, 60, 90].filter((d) => d <= minDay);
  if (milestones.length === 0) return null;

  const latestMilestone = milestones[milestones.length - 1];
  const lAtMilestone = pacingLandmark.trajectory.find((t) => t.day === latestMilestone);
  const bAtMilestone = pacingBroadway.trajectory.find((t) => t.day === latestMilestone);

  if (!lAtMilestone || !bAtMilestone) return null;

  const fbDelta = lAtMilestone.fb - bAtMilestone.fb;
  const winner = fbDelta > 0 ? 'Landmark' : 'Broadway';

  return {
    id: nextId(),
    category: 'positive',
    headline: `By day ${latestMilestone}: ${winner} led with ${Math.max(lAtMilestone.fb, bAtMilestone.fb)} units booked vs ${Math.min(lAtMilestone.fb, bAtMilestone.fb)}`,
    detail: `By campaign day ${latestMilestone}, Landmark had ${lAtMilestone.fb} units booked (from ${lAtMilestone.leadsCalled.toLocaleString()} unique leads) while Broadway had ${bAtMilestone.fb} (from ${bAtMilestone.leadsCalled.toLocaleString()} unique leads). ${winner} was ${(Math.abs(fbDelta) / Math.min(lAtMilestone.fb, bAtMilestone.fb) * 100).toFixed(0)}% ahead at this point.`,
    dataTrail: milestones.map((d) => {
      const l = pacingLandmark.trajectory.find((t) => t.day === d);
      const b = pacingBroadway.trajectory.find((t) => t.day === d);
      return {
        label: `Day ${d}`,
        value: `Landmark: ${l?.fb || 0} | Broadway: ${b?.fb || 0} booked`,
        context: `Landmark: ${l?.leadsCalled?.toLocaleString() || 0} leads | Broadway: ${b?.leadsCalled?.toLocaleString() || 0} leads`,
      };
    }),
    suggestion: `Legacy should target ${winner}'s day-${latestMilestone} benchmark of ${Math.max(lAtMilestone.fb, bAtMilestone.fb)} units booked. Track daily progress against this number.`,
    projectedImpact: null,
    priority: 2,
    sourceTable: 'T7',
    segment: 'Campaign velocity',
  };
}

function generateSegmentInsights(analysis: AnalysisResults): Insight[] {
  const insights: Insight[] = [];
  const { segmentComparisons } = analysis;

  const significantComps = segmentComparisons
    .filter((c) => c.significant && Math.abs(c.relativeDelta) > 0.15)
    .sort((a, b) => Math.abs(b.relativeDelta) - Math.abs(a.relativeDelta));

  for (const comp of significantComps.slice(0, 3)) {
    const [bucket, leadType, timeSlot] = comp.segment.split('|');
    const friendlySlot = slotLabel(timeSlot || '');
    const friendlyBucket = bucketLabel(bucket);
    const friendlyLeadType = leadTypeLabel(leadType || '');
    const isPositive = comp.value1 > comp.value2;

    const metricLabel = comp.metric === 'call_pickup_rate' ? 'connection rate'
      : comp.metric === 'conv_rate_psv' ? 'visit scheduling rate'
      : 'booking rate';

    insights.push({
      id: nextId(),
      category: isPositive ? 'positive' : 'suggestion',
      headline: `"${friendlyBucket}" ${friendlyLeadType} leads (${friendlySlot}): ${comp.project1} ${metricLabel} is ${(Math.abs(comp.relativeDelta) * 100).toFixed(0)}% ${isPositive ? 'higher' : 'lower'}`,
      detail: `${comp.project1} achieved ${(comp.value1 * 100).toFixed(1)}% ${metricLabel} vs ${comp.project2}'s ${(comp.value2 * 100).toFixed(1)}% for ${friendlyLeadType} leads in the "${friendlyBucket}" group during ${friendlySlot}. Sample: ${comp.sampleSize1.toLocaleString()} vs ${comp.sampleSize2.toLocaleString()} unique leads.`,
      dataTrail: [
        { label: comp.project1, value: `${(comp.value1 * 100).toFixed(2)}%`, context: `${comp.sampleSize1.toLocaleString()} unique leads` },
        { label: comp.project2, value: `${(comp.value2 * 100).toFixed(2)}%`, context: `${comp.sampleSize2.toLocaleString()} unique leads` },
      ],
      suggestion: isPositive
        ? `Apply ${comp.project1}'s approach for "${friendlyBucket}" ${friendlyLeadType} leads during ${friendlySlot}.`
        : `Look into why ${comp.project1}'s ${metricLabel} is lower for "${friendlyBucket}" ${friendlyLeadType} leads during ${friendlySlot}. Try shifting calls to better-performing time slots.`,
      projectedImpact: {
        metric: metricLabel,
        currentValue: Math.min(comp.value1, comp.value2),
        projectedValue: Math.min(comp.value1, comp.value2) + Math.abs(comp.delta) * REALIZATION_FACTOR,
        confidence: Math.abs(comp.relativeDelta) > 0.3 ? 'high' : 'medium',
        basis: `Statistically significant difference across ${(comp.sampleSize1 + comp.sampleSize2).toLocaleString()} unique leads`,
      },
      priority: 4,
      sourceTable: 'T1',
      segment: comp.segment,
    });
  }

  return insights;
}

// ---- Suggestion board ----

function generateDemoSuggestions(analysis: AnalysisResults): SuggestionItem[] {
  const suggestions: SuggestionItem[] = [];
  let sugId = 0;

  // Suggestion 1: Best score bucket strategy
  const landmarkBuckets = analysis.scoreBuckets.filter((b) => b.project === PROJECTS.LANDMARK);
  const broadwayBuckets = analysis.scoreBuckets.filter((b) => b.project === PROJECTS.BROADWAY);
  const bestLB = landmarkBuckets.sort((a, b) => b.fbPer100 - a.fbPer100)[0];
  const matchingBB = broadwayBuckets.find((b) => b.scoreBucket === bestLB?.scoreBucket);

  if (bestLB && matchingBB) {
    const friendly = bucketLabel(bestLB.scoreBucket);
    suggestions.push({
      id: `sug-${++sugId}`,
      ifCondition: `Call "${friendly}" quality leads first in Legacy`,
      thenImpact: `Expect ~${(bestLB.fbPer100 * REALIZATION_FACTOR).toFixed(1)} bookings per 100 leads (conservative estimate)`,
      confidence: bestLB.fbPer100 > matchingBB.fbPer100 ? 'high' : 'medium',
      basedOn: `Landmark booked ${bestLB.fbPer100.toFixed(1)} per 100 in this group vs Broadway's ${matchingBB.fbPer100.toFixed(1)}`,
      currentValue: matchingBB.fbPer100,
      projectedValue: bestLB.fbPer100,
      conservativeValue: matchingBB.fbPer100 + (bestLB.fbPer100 - matchingBB.fbPer100) * REALIZATION_FACTOR,
      metric: 'Bookings per 100 leads',
    });
  }

  // Suggestion 2: Best time slot — ranked by effective contribution (rate × volume)
  // This avoids recommending tiny-volume slots like Evening that have high rates but few leads
  const slotsRankedL = [...analysis.callingPatternsLandmark]
    .filter(s => s.firstCallLeads > 100)
    .sort((a, b) => (b.leadPickupRate * b.volumeShare) - (a.leadPickupRate * a.volumeShare));
  const bestSlotL = slotsRankedL[0];
  const bestSlotB = analysis.callingPatternsBroadway.find((b) => b.timeSlot === bestSlotL?.timeSlot);
  if (bestSlotL && bestSlotB) {
    const betterRate = Math.max(bestSlotL.leadPickupRate, bestSlotB.leadPickupRate);
    const worseRate = Math.min(bestSlotL.leadPickupRate, bestSlotB.leadPickupRate);
    const winnerVol = bestSlotL.leadPickupRate > bestSlotB.leadPickupRate ? bestSlotL : bestSlotB;
    const friendly = slotLabel(bestSlotL.timeSlot);
    suggestions.push({
      id: `sug-${++sugId}`,
      ifCondition: `Optimise Legacy calling during ${friendly} (${(winnerVol.volumeShare * 100).toFixed(0)}% of lead volume)`,
      thenImpact: `Expect ~${(betterRate * 100).toFixed(0)}% lead connection rate (${(betterRate / Math.max(worseRate, 0.01)).toFixed(2)}× vs weaker campaign's ${(worseRate * 100).toFixed(0)}%)`,
      confidence: betterRate - worseRate > 0.05 && winnerVol.volumeShare > 0.1 ? 'high' : 'medium',
      basedOn: `Best per-lead connection rate with meaningful volume during ${friendly} across ${winnerVol.firstCallLeads.toLocaleString()} leads`,
      currentValue: worseRate,
      projectedValue: betterRate,
      conservativeValue: worseRate + (betterRate - worseRate) * REALIZATION_FACTOR,
      metric: 'Lead connection rate',
    });
  }

  // Suggestion 3: Follow-through improvement
  const betterHandoff = analysis.handoffLandmark.avgHandoffRate > analysis.handoffBroadway.avgHandoffRate
    ? analysis.handoffLandmark : analysis.handoffBroadway;
  const worseHandoff = analysis.handoffLandmark.avgHandoffRate > analysis.handoffBroadway.avgHandoffRate
    ? analysis.handoffBroadway : analysis.handoffLandmark;

  if (betterHandoff.avgHandoffRate - worseHandoff.avgHandoffRate > 0.03) {
    suggestions.push({
      id: `sug-${++sugId}`,
      ifCondition: `Follow up every scheduled visit within 48 hours and flag leads with no follow-up`,
      thenImpact: `Improve visit follow-through from ${(worseHandoff.avgHandoffRate * 100).toFixed(0)}% toward ${(betterHandoff.avgHandoffRate * 100).toFixed(0)}%`,
      confidence: 'high',
      basedOn: `The campaign with faster follow-up (avg ${betterHandoff.avgDaysPsvToSv.toFixed(1)} days) got ${(betterHandoff.avgHandoffRate * 100).toFixed(0)}% of leads to visit vs ${(worseHandoff.avgHandoffRate * 100).toFixed(0)}%`,
      currentValue: worseHandoff.avgHandoffRate,
      projectedValue: betterHandoff.avgHandoffRate,
      conservativeValue: worseHandoff.avgHandoffRate + (betterHandoff.avgHandoffRate - worseHandoff.avgHandoffRate) * REALIZATION_FACTOR,
      metric: 'Visit follow-through rate',
    });
  }

  // Suggestion 4: Volume play
  const { pacingLandmark, pacingBroadway } = analysis;
  if (pacingLandmark.cumulativeLeadsCalled > 0 && pacingBroadway.cumulativeLeadsCalled > 0) {
    const bookingsPerLead_L = pacingLandmark.cumulativeFb / pacingLandmark.cumulativeLeadsCalled;
    const bookingsPerLead_B = pacingBroadway.cumulativeFb / pacingBroadway.cumulativeLeadsCalled;
    const bestRate = Math.max(bookingsPerLead_L, bookingsPerLead_B);
    const maxLeads = Math.max(pacingLandmark.cumulativeLeadsCalled, pacingBroadway.cumulativeLeadsCalled);
    suggestions.push({
      id: `sug-${++sugId}`,
      ifCondition: `Reach ${maxLeads.toLocaleString()}+ unique leads in Legacy (matching the larger campaign)`,
      thenImpact: `At the better campaign's rate, that's ~${Math.round(maxLeads * bestRate)} potential bookings`,
      confidence: 'medium',
      basedOn: `Best booking rate across campaigns: ${(bestRate * 100).toFixed(2)}% of unique leads`,
      currentValue: Math.min(bookingsPerLead_L, bookingsPerLead_B),
      projectedValue: bestRate,
      conservativeValue: Math.min(bookingsPerLead_L, bookingsPerLead_B) + (bestRate - Math.min(bookingsPerLead_L, bookingsPerLead_B)) * REALIZATION_FACTOR,
      metric: 'Bookings per lead',
    });
  }

  // Suggestion 5 removed: NRI leads are called in evenings by design —
  // stating "split NRI to evening, India to morning" is the existing process, not an insight.

  return suggestions;
}

// ---- Live mode insights (Legacy vs benchmarks) ----

function generateLiveInsights(analysis: AnalysisResults): Insight[] {
  insightCounter = 0;
  const insights: Insight[] = [];

  // Pacing insight — most critical
  if (analysis.pacingLegacy) {
    const pl = analysis.pacingLegacy;
    const day = pl.latestDay;
    const lAtDay = analysis.pacingLandmark.trajectory.find((t) => t.day === day);
    const bAtDay = analysis.pacingBroadway.trajectory.find((t) => t.day === day);

    if (lAtDay && bAtDay) {
      const vsL = lAtDay.fb > 0 ? pl.cumulativeFb / lAtDay.fb : 0;
      const vsB = bAtDay.fb > 0 ? pl.cumulativeFb / bAtDay.fb : 0;
      const status = vsL >= 0.8 && vsB >= 0.8 ? 'positive' :
        vsL >= 0.5 || vsB >= 0.5 ? 'suggestion' : 'warning';

      insights.push({
        id: nextId(),
        category: status as 'positive' | 'suggestion' | 'warning',
        headline: `Legacy Day ${day}: ${pl.cumulativeFb} units booked — ${(vsL * 100).toFixed(0)}% of Landmark's pace, ${(vsB * 100).toFixed(0)}% of Broadway's`,
        detail: `At campaign day ${day}, Legacy has booked ${pl.cumulativeFb} units from ${pl.cumulativeLeadsCalled.toLocaleString()} unique leads. At the same point, Landmark had ${lAtDay.fb} and Broadway had ${bAtDay.fb}. ${pl.projectedFb90 ? `At the current pace, Legacy is on track for ~${pl.projectedFb90} bookings by day 90.` : ''}`,
        dataTrail: [
          { label: `Legacy Day ${day}`, value: `${pl.cumulativeFb} booked`, context: `${pl.cumulativeLeadsCalled.toLocaleString()} unique leads, ${(pl.cumulativePickupRate * 100).toFixed(1)}% connected` },
          { label: `Landmark Day ${day}`, value: `${lAtDay.fb} booked`, context: `${lAtDay.leadsCalled.toLocaleString()} unique leads` },
          { label: `Broadway Day ${day}`, value: `${bAtDay.fb} booked`, context: `${bAtDay.leadsCalled.toLocaleString()} unique leads` },
        ],
        suggestion: vsL < 0.8
          ? `Legacy needs ~${Math.ceil((lAtDay.fb - pl.cumulativeFb) / Math.max(1, 90 - day))} more bookings per day to match Landmark's pace by day 90.`
          : `Legacy is on track. Keep the current approach and review weekly.`,
        projectedImpact: pl.projectedFb90 ? {
          metric: 'Bookings by day 90',
          currentValue: pl.cumulativeFb,
          projectedValue: pl.projectedFb90,
          confidence: day > 30 ? 'medium' : 'low',
          basis: `Linear projection from ${day} days of data`,
        } : null,
        priority: 1,
        sourceTable: 'T7',
        segment: 'Campaign velocity',
      });
    }
  }

  // Segment-level insights
  const segmentInsights = generateSegmentInsights(analysis);
  insights.push(...segmentInsights);

  return insights.sort((a, b) => a.priority - b.priority);
}

// ---- Main orchestrator ----

export function generateInsights(
  data: LoadedData,
  analysis: AnalysisResults
): { insights: Insight[]; suggestions: SuggestionItem[] } {
  if (data.mode === 'demo') {
    return {
      insights: generateDemoInsights(analysis),
      suggestions: generateDemoSuggestions(analysis),
    };
  }

  return {
    insights: generateLiveInsights(analysis),
    suggestions: generateDemoSuggestions(analysis),
  };
}
