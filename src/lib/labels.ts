// ============================================================
// Plain-English Label System
// All user-facing text goes through this file.
// No jargon: PSV, SV, FB, SC, NI are NEVER shown to users.
// Everything is based on UNIQUE LEADS, not call counts.
// ============================================================

// ---- Funnel stage labels (user-facing) ----
export const STAGE = {
  PSV: 'Site Visit Scheduled',
  SV: 'Site Visit Completed',
  FB: 'Unit Booked',
  SC: 'Deal Closed',
  NI: 'Not Interested',
  LI: 'Contacted',
} as const;

// ---- Metric labels (user-facing) ----
export const METRIC = {
  UNIQUE_LEADS: 'Unique Leads',
  LEADS_REACHED: 'Leads Connected',
  REACH_RATE: 'Connection Rate',
  VISIT_SCHEDULED_RATE: 'Visit Scheduling Rate',
  VISIT_COMPLETED_RATE: 'Visit Completion Rate',
  BOOKING_RATE: 'Booking Rate',
  BOOKINGS_PER_100: 'Bookings per 100 Leads',
  FOLLOW_THROUGH_RATE: 'Follow-Through Rate',
} as const;

// ---- Score bucket legend (shown in info buttons) ----
export const SCORE_BUCKET_LEGEND = `Lead Quality Scores are assigned automatically based on a lead's online activity — things like website visits, pages viewed, and time spent browsing listings.

Higher scores mean the lead showed more interest online before being called.

Score Ranges:
• Very High (0.10+) — Highly active online, strong buying signals
• High (0.07–0.10) — Frequently browsing, likely interested
• Medium (0.045–0.07) — Moderate online activity
• Low (0.03–0.045) — Some activity, early stage
• Very Low (0–0.03) — Minimal online engagement
• No Score — No tracked online activity yet`;

// ---- Score bucket display labels ----
export const SCORE_BUCKET_LABELS: Record<string, string> = {
  '0.1+': 'Very High',
  '0.07-0.1': 'High',
  '0.045-0.07': 'Medium',
  '0.03-0.045': 'Low',
  '0-0.03': 'Very Low',
  'No Score': 'No Score',
};

// ---- Agent performance legend ----
export const AGENT_PERFORMANCE_LEGEND = `Agents are rated A through D based on how their results compare to other agents working with similar lead types and quality scores.

• A — Top performers (top 25%)
• B — Above average (25–50%)
• C — Below average (50–75%)
• D — Needs improvement (bottom 25%)

Ratings update every 7 days and only count when an agent has handled enough leads for a fair comparison.`;

// ---- Chart tab labels for Campaign Trajectory ----
export const TRAJECTORY_TABS = {
  PICKUP: { label: 'Connection Rate', subtitle: 'What % of unique leads picked up the phone, over time' },
  VISIT_SCHEDULED: { label: 'Visit Scheduling Rate', subtitle: 'What % of unique leads scheduled a site visit, over time' },
  VISIT_COMPLETED: { label: 'Visit Completion Rate', subtitle: 'Day-on-day: what % of each day\'s new leads completed a site visit' },
  BOOKINGS: { label: 'Units Booked', subtitle: 'How many units were booked cumulatively, day by day' },
} as const;

// ---- Drill-down metric labels ----
export const DRILLDOWN = {
  TOTAL_CALLS: 'Total Calls Made',
  LEADS_CONNECTED: 'Leads Connected',
  UNIQUE_LEADS: 'Unique Leads Called',
  CONNECTION_RATE: 'Connection Rate',
  VISITS_SCHEDULED: 'Visits Scheduled',
  VISIT_SCHEDULE_RATE: 'Visit Scheduling Rate',
  CUMULATIVE_BOOKINGS: 'Total Units Booked',
  CUMULATIVE_DEALS: 'Total Deals Closed',
} as const;

// ---- Health card labels ----
export const HEALTH_CARDS = {
  BOOKINGS: {
    label: 'Units Booked',
    tooltip: 'Total units booked across the campaign so far. Compared at the same campaign day — so if Legacy is on Day 5, you see what Broadway and Landmark had by their Day 5 too.',
  },
  DEALS: {
    label: 'Deals Closed',
    tooltip: 'Sales that are fully closed. This is the final step in the funnel — a lead went from first call all the way to signing.',
  },
  BOOKINGS_PER_100: {
    label: 'Bookings per 100 Leads',
    tooltip: 'For every 100 unique leads called, how many ended up booking a unit? Higher is better. Uses unique leads (not repeat calls) as the base.',
  },
  CONNECTION_RATE: {
    label: 'Connection Rate',
    tooltip: 'What percentage of unique leads actually picked up the phone when called? This counts each lead only once, even if they were called multiple times.',
  },
} as const;
