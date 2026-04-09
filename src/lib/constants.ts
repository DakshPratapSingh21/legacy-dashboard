// ============================================================
// Constants — score buckets, stages, colors, project metadata
// ============================================================

export const PROJECTS = {
  LANDMARK: 'LANDMARK',
  BROADWAY: 'BROADWAY',
  LEGACY: 'LEGACY',
} as const;

export const PROJECT_START_DATES: Record<string, string> = {
  LANDMARK: '2024-07-10',
  BROADWAY: '2025-01-07',
};

export const SCORE_BUCKETS = [
  '0-0.03',
  '0.03-0.045',
  '0.045-0.07',
  '0.07-0.1',
  '0.1+',
  'No Score',
] as const;

export const LEAD_TYPES = [
  'existing_scored',
  'existing_unscored',
  'new',
] as const;

export const TIME_SLOTS = [
  '1_Morning',
  '2_Afternoon',
  '3_Evening',
  '4_Off Hours',
] as const;

export const SOURCE_GROUPS = [
  'WhatsApp', 'Web', 'Event', 'DB', 'Referral', 'Walk-in', 'CP', 'Other',
] as const;

export const FUNNEL_STAGES = [
  'New Lead',
  'Lead Initiated',
  'Pre Site Visit',
  'Post Site Visit',
  'Flat Blocked',
  'Sales Closure',
  'Not Interested',
] as const;

export const STAGE_ABBREVIATIONS: Record<string, string> = {
  'New Lead': 'NL',
  'Lead Initiated': 'LI',
  'Pre Site Visit': 'PSV',
  'Post Site Visit': 'SV',
  'Flat Blocked': 'FB',
  'Sales Closure': 'SC',
  'Not Interested': 'NI',
};

export const PERFORMANCE_BINS = ['A', 'B', 'C', 'D', 'Insufficient Data'] as const;

export const ACTION_PRIORITIES: Record<string, number> = {
  ESCALATE: 1,
  MOVE_TO_PSV: 2,
  CALL_NOW: 3,
  REASSIGN: 4,
  DEPRIORITIZE: 5,
  ON_TRACK: 6,
};

// Chart colors — OKLCH-derived hex values for SVG compatibility
// Min 20% luminance difference between adjacent series
export const PROJECT_COLORS: Record<string, string> = {
  LANDMARK: '#6B82E8',  /* oklch(62% 0.14 250) */
  BROADWAY: '#D4A745',  /* oklch(75% 0.14 75) */
  LEGACY: '#1E9B52',    /* oklch(50% 0.17 155) */
};

export const STATUS_COLORS: Record<string, string> = {
  good: 'text-emerald-400',
  warning: 'text-amber-400',
  critical: 'text-red-400',
};

export const REALIZATION_FACTOR = 0.6;
export const Z_SCORE_THRESHOLD = 1.96; // 95% confidence
export const MIN_SAMPLE_SIZE = 20;
