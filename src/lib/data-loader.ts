// ============================================================
// Data Loader — CSV files, Metabase API, mode detection
// ============================================================

import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import type {
  AllTablesData,
  LoadedData,
  T1CallingMetrics,
  T2CohortConversion,
  T3ScoreThreshold,
  T4PresalesPerformance,
  T5HandoffQuality,
  T6LeadSignals,
  T7CampaignVelocity,
} from './types';

// In-memory cache
let cachedData: LoadedData | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getDataDir(): string {
  return path.join(process.cwd(), 'data');
}

function parseCSV<T>(filePath: string): T[] {
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, 'utf-8');
  const result = Papa.parse<T>(raw, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
  });
  return result.data;
}

function tryLoadTable<T>(dir: string, filename: string): T[] {
  const filePath = path.join(dir, filename);
  return parseCSV<T>(filePath);
}

function loadBenchmarkData(): AllTablesData {
  const dir = path.join(getDataDir(), 'benchmark');
  return {
    t1: tryLoadTable<T1CallingMetrics>(dir, 't1_calling_metrics.csv'),
    t2: tryLoadTable<T2CohortConversion>(dir, 't2_cohort_conversion.csv'),
    t3: tryLoadTable<T3ScoreThreshold>(dir, 't3_score_threshold_performance.csv'),
    t4: tryLoadTable<T4PresalesPerformance>(dir, 't4_presales_performance.csv'),
    t5: tryLoadTable<T5HandoffQuality>(dir, 't5_handoff_quality.csv'),
    t6: tryLoadTable<T6LeadSignals>(dir, 't6_lead_level_signals.csv'),
    t7: tryLoadTable<T7CampaignVelocity>(dir, 't7_campaign_velocity.csv'),
  };
}

function loadLegacyData(): Partial<AllTablesData> | null {
  const dir = path.join(getDataDir(), 'legacy');
  if (!fs.existsSync(dir)) return null;

  const t1 = tryLoadTable<T1CallingMetrics>(dir, 't1_calling_metrics.csv');
  const t7 = tryLoadTable<T7CampaignVelocity>(dir, 't7_campaign_velocity.csv');

  // If no legacy data at all, return null (demo mode)
  if (t1.length === 0 && t7.length === 0) return null;

  return {
    t1,
    t2: tryLoadTable<T2CohortConversion>(dir, 't2_cohort_conversion.csv'),
    t3: tryLoadTable<T3ScoreThreshold>(dir, 't3_score_threshold_performance.csv'),
    t4: tryLoadTable<T4PresalesPerformance>(dir, 't4_presales_performance.csv'),
    t5: tryLoadTable<T5HandoffQuality>(dir, 't5_handoff_quality.csv'),
    t6: tryLoadTable<T6LeadSignals>(dir, 't6_lead_level_signals.csv'),
    t7,
  };
}

async function loadFromMetabase(): Promise<LoadedData | null> {
  const metabaseUrl = process.env.METABASE_URL;
  const metabaseToken = process.env.METABASE_TOKEN;

  if (!metabaseUrl || !metabaseToken) return null;

  // Metabase card IDs — configure these via env or a config file
  const cardIds: Record<string, number> = {
    t1_benchmark: parseInt(process.env.MB_CARD_T1_BENCHMARK || '0'),
    t2_benchmark: parseInt(process.env.MB_CARD_T2_BENCHMARK || '0'),
    t3_benchmark: parseInt(process.env.MB_CARD_T3_BENCHMARK || '0'),
    t4_benchmark: parseInt(process.env.MB_CARD_T4_BENCHMARK || '0'),
    t5_benchmark: parseInt(process.env.MB_CARD_T5_BENCHMARK || '0'),
    t6_benchmark: parseInt(process.env.MB_CARD_T6_BENCHMARK || '0'),
    t7_benchmark: parseInt(process.env.MB_CARD_T7_BENCHMARK || '0'),
  };

  // Only attempt if at least one card ID is configured
  if (Object.values(cardIds).every((id) => id === 0)) return null;

  try {
    const fetchCard = async (cardId: number): Promise<string> => {
      if (cardId === 0) return '';
      const resp = await fetch(`${metabaseUrl}/api/card/${cardId}/query/csv`, {
        headers: { 'X-Metabase-Session': metabaseToken },
      });
      if (!resp.ok) throw new Error(`Metabase card ${cardId}: ${resp.status}`);
      return resp.text();
    };

    // Fetch all cards in parallel
    const csvTexts = await Promise.all(
      Object.values(cardIds).map((id) => fetchCard(id))
    );

    const parseText = <T>(csv: string): T[] => {
      if (!csv) return [];
      return Papa.parse<T>(csv, { header: true, dynamicTyping: true, skipEmptyLines: true }).data;
    };

    const benchmark: AllTablesData = {
      t1: parseText<T1CallingMetrics>(csvTexts[0]),
      t2: parseText<T2CohortConversion>(csvTexts[1]),
      t3: parseText<T3ScoreThreshold>(csvTexts[2]),
      t4: parseText<T4PresalesPerformance>(csvTexts[3]),
      t5: parseText<T5HandoffQuality>(csvTexts[4]),
      t6: parseText<T6LeadSignals>(csvTexts[5]),
      t7: parseText<T7CampaignVelocity>(csvTexts[6]),
    };

    return {
      benchmark,
      legacy: null, // Metabase legacy loading would follow same pattern
      mode: 'demo',
      currentCampaignDay: null,
      lastRefresh: new Date().toISOString(),
    };
  } catch {
    console.error('Metabase load failed, falling back to CSV');
    return null;
  }
}

function detectCurrentCampaignDay(legacy: Partial<AllTablesData> | null): number | null {
  if (!legacy?.t7 || legacy.t7.length === 0) return null;
  const maxDay = Math.max(...legacy.t7.map((r) => r.campaign_day));
  return maxDay;
}

export async function loadData(forceRefresh = false): Promise<LoadedData> {
  const now = Date.now();
  if (cachedData && !forceRefresh && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedData;
  }

  // Try Metabase first
  const metabaseData = await loadFromMetabase();
  if (metabaseData) {
    cachedData = metabaseData;
    cacheTimestamp = now;
    return metabaseData;
  }

  // Fall back to CSV files
  const benchmark = loadBenchmarkData();
  const legacy = loadLegacyData();
  const mode = legacy ? 'live' : 'demo';
  const currentCampaignDay = detectCurrentCampaignDay(legacy);

  // Check .last-refresh file for cron script timestamp
  const refreshFile = path.join(getDataDir(), 'legacy', '.last-refresh');
  let lastRefresh = new Date().toISOString();
  if (fs.existsSync(refreshFile)) {
    const stat = fs.statSync(refreshFile);
    lastRefresh = stat.mtime.toISOString();
  }

  const data: LoadedData = {
    benchmark,
    legacy,
    mode,
    currentCampaignDay,
    lastRefresh,
  };

  cachedData = data;
  cacheTimestamp = now;
  return data;
}

export function getLoadedTableNames(data: LoadedData): string[] {
  const tables: string[] = [];
  const checkTables = (prefix: string, tablesObj: Partial<AllTablesData>) => {
    if (tablesObj.t1?.length) tables.push(`${prefix}_t1`);
    if (tablesObj.t2?.length) tables.push(`${prefix}_t2`);
    if (tablesObj.t3?.length) tables.push(`${prefix}_t3`);
    if (tablesObj.t4?.length) tables.push(`${prefix}_t4`);
    if (tablesObj.t5?.length) tables.push(`${prefix}_t5`);
    if (tablesObj.t6?.length) tables.push(`${prefix}_t6`);
    if (tablesObj.t7?.length) tables.push(`${prefix}_t7`);
  };
  checkTables('benchmark', data.benchmark);
  if (data.legacy) checkTables('legacy', data.legacy);
  return tables;
}
