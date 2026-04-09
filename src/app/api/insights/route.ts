import { NextResponse } from 'next/server';
import { loadData } from '@/lib/data-loader';
import { runAnalysis } from '@/lib/statistical-engine';
import { generateInsights } from '@/lib/insight-generator';

export const dynamic = 'force-dynamic';

function mapToObject<V>(map: Map<number, V>): Record<number, V> {
  const obj: Record<number, V> = {};
  for (const [k, v] of map) obj[k] = v;
  return obj;
}

export async function GET() {
  try {
    const data = await loadData();
    const analysis = runAnalysis(data);
    const { insights, suggestions } = generateInsights(data, analysis);

    return NextResponse.json({
      mode: data.mode,
      currentCampaignDay: data.currentCampaignDay,
      healthPulse: analysis.healthPulse,
      insights,
      suggestions,

      // Full trajectory data for charts
      trajectory: {
        landmark: analysis.pacingLandmark.trajectory,
        broadway: analysis.pacingBroadway.trajectory,
        legacy: analysis.pacingLegacy?.trajectory || null,
      },

      // Pacing summaries for health cards
      pacing: {
        landmark: {
          latestDay: analysis.pacingLandmark.latestDay,
          fb: analysis.pacingLandmark.cumulativeFb,
          sc: analysis.pacingLandmark.cumulativeSc,
          psv: analysis.pacingLandmark.cumulativePsv,
          sv: analysis.pacingLandmark.cumulativeSv,
          leadsCalled: analysis.pacingLandmark.cumulativeLeadsCalled,
          pickupRate: analysis.pacingLandmark.cumulativePickupRate,
          projectedFb60: analysis.pacingLandmark.projectedFb60,
          projectedFb90: analysis.pacingLandmark.projectedFb90,
        },
        broadway: {
          latestDay: analysis.pacingBroadway.latestDay,
          fb: analysis.pacingBroadway.cumulativeFb,
          sc: analysis.pacingBroadway.cumulativeSc,
          psv: analysis.pacingBroadway.cumulativePsv,
          sv: analysis.pacingBroadway.cumulativeSv,
          leadsCalled: analysis.pacingBroadway.cumulativeLeadsCalled,
          pickupRate: analysis.pacingBroadway.cumulativePickupRate,
          projectedFb60: analysis.pacingBroadway.projectedFb60,
          projectedFb90: analysis.pacingBroadway.projectedFb90,
        },
        legacy: analysis.pacingLegacy ? {
          latestDay: analysis.pacingLegacy.latestDay,
          fb: analysis.pacingLegacy.cumulativeFb,
          sc: analysis.pacingLegacy.cumulativeSc,
          psv: analysis.pacingLegacy.cumulativePsv,
          sv: analysis.pacingLegacy.cumulativeSv,
          leadsCalled: analysis.pacingLegacy.cumulativeLeadsCalled,
          pickupRate: analysis.pacingLegacy.cumulativePickupRate,
          projectedFb60: analysis.pacingLegacy.projectedFb60,
          projectedFb90: analysis.pacingLegacy.projectedFb90,
        } : null,
      },

      // Backward compat
      velocity: {
        landmark: analysis.pacingLandmark.trajectory,
        broadway: analysis.pacingBroadway.trajectory,
        legacy: analysis.pacingLegacy?.trajectory || null,
      },
      callingPatterns: {
        landmark: analysis.callingPatternsLandmark,
        broadway: analysis.callingPatternsBroadway,
        legacy: analysis.callingPatternsLegacy,
      },
      scoreBuckets: analysis.scoreBuckets,
      handoffs: {
        landmark: {
          rate: analysis.handoffLandmark.avgHandoffRate,
          dropRate: analysis.handoffLandmark.avgDropRate,
          weeklyTrend: analysis.handoffLandmark.weeklyTrend,
        },
        broadway: {
          rate: analysis.handoffBroadway.avgHandoffRate,
          dropRate: analysis.handoffBroadway.avgDropRate,
          weeklyTrend: analysis.handoffBroadway.weeklyTrend,
        },
        legacy: analysis.handoffLegacy ? {
          rate: analysis.handoffLegacy.avgHandoffRate,
          dropRate: analysis.handoffLegacy.avgDropRate,
          weeklyTrend: analysis.handoffLegacy.weeklyTrend,
        } : null,
      },

      // Day-level drill-down data (using first_call_leads)
      dayDrilldown: {
        landmark: mapToObject(analysis.dayDrilldownLandmark),
        broadway: mapToObject(analysis.dayDrilldownBroadway),
        legacy: analysis.dayDrilldownLegacy ? mapToObject(analysis.dayDrilldownLegacy) : null,
      },

      // NRI vs India split summary (overall for insights)
      nriPatterns: {
        landmark: analysis.nriPatternsLandmark,
        broadway: analysis.nriPatternsBroadway,
        legacy: analysis.nriPatternsLegacy,
      },

      // Day-level NRI splits (for drill-down modal)
      dayNri: {
        landmark: mapToObject(analysis.dayNriLandmark),
        broadway: mapToObject(analysis.dayNriBroadway),
        legacy: analysis.dayNriLegacy ? mapToObject(analysis.dayNriLegacy) : null,
      },

      // Executive performance bin data (T4)
      execBins: analysis.execBins,
    });
  } catch (error) {
    console.error('Insights API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate insights', detail: String(error) },
      { status: 500 }
    );
  }
}
