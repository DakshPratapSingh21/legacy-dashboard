// ============================================================
// TypeScript interfaces for all 7 tables + insight/API types
// ============================================================

// ---- T1: Calling Metrics ----
export interface T1CallingMetrics {
  campaign_day: number;
  campaign_week: number;
  campaign_month: number;
  actual_date: string;
  data_as_of_date: string;
  project: string;
  lead_type: LeadType;
  score_bucket: ScoreBucket;
  source_group: SourceGroup;
  time_slot: TimeSlot;
  is_nri: NriStatus;
  dialer_mode: string;
  executive_id: string;
  executive_name: string;
  first_call_leads: number;
  leads_called: number;
  total_calls: number;
  answered_calls: number;
  call_pickup_rate: number;
  lead_pickup_rate: number;
  avg_call_duration_sec: number;
  avg_score_at_call: number | null;
  avg_score_age_days: number | null;
  avg_days_to_first_call: number;
  leads_reached_li: number;
  leads_reached_psv: number;
  leads_reached_sv: number;
  leads_reached_fb: number;
  leads_reached_sc: number;
  leads_reached_ni: number;
  conv_rate_li: number;
  conv_rate_psv: number;
  conv_rate_sv: number;
  conv_rate_fb: number;
  conv_rate_sc: number;
  conv_rate_ni: number;
  avg_days_to_li: number;
  avg_days_to_psv: number;
  avg_days_to_sv: number;
  avg_days_to_fb: number;
  avg_days_to_sc: number;
  avg_days_to_ni: number;
}

// ---- T2: Cohort Conversion ----
export interface T2CohortConversion {
  campaign_day: number;
  campaign_week: number;
  actual_date: string;
  data_as_of_date: string;
  project: string;
  lead_type: LeadType;
  score_bucket: ScoreBucket;
  source_group: SourceGroup;
  campaign_type: string;
  utm_medium: string;
  leads_called: number;
  avg_days_to_first_call: number;
  called_within_1_day: number;
  called_within_3_days: number;
  called_after_7_days: number;
  li_day0: number; li_day1: number; li_day7: number; li_day14: number; li_day30: number;
  psv_day0: number; psv_day1: number; psv_day7: number; psv_day14: number; psv_day30: number;
  sv_day0: number; sv_day1: number; sv_day7: number; sv_day14: number; sv_day30: number;
  fb_day0: number; fb_day7: number; fb_day14: number; fb_day30: number;
  sc_day0: number; sc_day7: number; sc_day14: number; sc_day30: number;
  ni_day0: number; ni_day1: number; ni_day7: number; ni_day14: number; ni_day30: number;
}

// ---- T3: Score Threshold Performance ----
export interface T3ScoreThreshold {
  project: string;
  campaign_week: number;
  score_bucket_at_call: string;
  source_group: SourceGroup;
  score_model_version: string;
  data_as_of_date: string;
  total_leads_in_db: number;
  leads_called: number;
  leads_never_called: number;
  call_coverage_rate: number;
  avg_score_at_call: number | null;
  avg_score_age_days: number | null;
  avg_call_pickup_rate: number;
  avg_lead_pickup_rate: number;
  avg_call_duration_sec: number;
  avg_calls_to_first_pickup: number;
  conv_rate_li: number;
  conv_rate_psv: number;
  conv_rate_sv: number;
  conv_rate_fb: number;
  conv_rate_sc: number;
  conv_rate_ni: number;
  avg_days_to_psv: number;
  avg_days_to_sv: number;
  avg_days_to_fb: number;
  avg_days_to_sc: number;
  fb_per_100_leads_called: number;
  sc_per_100_leads_called: number;
}

// ---- T4: Presales Performance ----
export interface T4PresalesPerformance {
  rolling_window_end_date: string;
  rolling_window_start_date: string;
  campaign_day: number;
  data_as_of_date: string;
  project: string;
  executive_id: string;
  executive_name: string;
  lead_type: LeadType;
  score_bucket: ScoreBucket;
  is_sufficient_data: boolean;
  leads_assigned: number;
  leads_called: number;
  leads_reassigned_out: number;
  leads_reassigned_in: number;
  net_leads_responsible: number;
  call_coverage_rate: number;
  total_calls: number;
  answered_calls: number;
  call_pickup_rate: number;
  lead_pickup_rate: number;
  avg_call_duration_sec: number;
  avg_calls_per_lead: number;
  leads_reached_psv: number;
  leads_reached_ni: number;
  conv_rate_psv: number;
  conv_rate_ni: number;
  avg_days_to_psv: number;
  leads_eventually_fb: number;
  leads_eventually_sc: number;
  fb_attribution_rate: number;
  performance_bin: string;
  bin_percentile: number;
}

// ---- T5: Handoff Quality ----
export interface T5HandoffQuality {
  campaign_week: number;
  campaign_month: number;
  actual_date_week_start: string;
  data_as_of_date: string;
  project: string;
  lead_type: LeadType;
  score_bucket: ScoreBucket;
  is_nri: NriStatus;
  sales_executive_id: string;
  sales_executive_name: string;
  leads_reached_psv: number;
  leads_converted_sv: number;
  handoff_conversion_rate: number;
  avg_days_psv_to_sv: number;
  avg_followup_calls_after_psv: number;
  leads_never_followed_up: number;
  total_sv_scheduled_not_attended: number;
  leads_dropped_after_psv: number;
  drop_rate_after_psv: number;
  leads_sv_to_fb: number;
  sv_to_fb_rate: number;
  leads_fb_to_sc: number;
  fb_to_sc_rate: number;
  avg_days_sv_to_fb: number;
  avg_days_fb_to_sc: number;
}

// ---- T6: Lead Level Signals ----
export interface T6LeadSignals {
  lead_id: string;
  project: string;
  data_as_of_date: string;
  executive_id: string;
  executive_name: string;
  performance_bin: string;
  lead_type: LeadType;
  score_bucket: ScoreBucket;
  is_nri: NriStatus;
  current_stage: string;
  days_in_current_stage: number;
  days_since_lead_created: number;
  days_in_new_lead: number;
  days_in_lead_initiated: number;
  days_in_psv: number;
  total_calls: number;
  answered_calls: number;
  unanswered_streak: number;
  last_call_date: string;
  days_since_last_call: number;
  avg_call_duration_sec: number;
  max_score: number | null;
  score_age_days: number | null;
  cross_project_max_stage: string;
  cross_project_ni_count: number;
  cross_project_sv_count: number;
  had_web_visit_before_call: number;
  had_whatsapp_before_call: number;
  had_inbound_call_before_outreach: number;
  had_bot_interaction_before_call: number;
  pre_call_engagement_channel: string;
  ni_risk_flag: string;
  psv_ready_flag: boolean;
  stale_score_flag: boolean;
  high_value_flag: boolean;
  action_needed: ActionNeeded;
  last_refreshed_at: string;
}

// ---- T7: Campaign Velocity ----
export interface T7CampaignVelocity {
  campaign_day: number;
  campaign_week: number;
  actual_date: string;
  data_as_of_date: string;
  project: string;
  cumulative_leads_called: number;
  cumulative_leads_picked_up: number;
  cumulative_psv: number;
  cumulative_sv: number;
  cumulative_fb: number;
  cumulative_sc: number;
  cumulative_ni: number;
  target_fb: number | null;
  pacing_vs_target: number | null;
  required_daily_fb_to_hit_target: number | null;
  cumulative_call_pickup_rate: number;
  cumulative_lead_pickup_rate: number;
  cumulative_conv_rate_psv: number;
  cumulative_conv_rate_sv: number;
  cumulative_conv_rate_fb: number;
  cumulative_conv_rate_sc: number;
  pacing_vs_landmark: number | null;
  pacing_vs_broadway: number | null;
  projected_fb_at_day60: number | null;
  projected_fb_at_day90: number | null;
}

// ---- Enums / Union types ----
export type LeadType = 'existing_scored' | 'existing_unscored' | 'new';
export type ScoreBucket = '0-0.03' | '0.03-0.045' | '0.045-0.07' | '0.07-0.1' | '0.1+' | 'No Score';
export type SourceGroup = 'WhatsApp' | 'Web' | 'Event' | 'DB' | 'Referral' | 'Walk-in' | 'CP' | 'Other';
export type TimeSlot = '1_Morning' | '2_Afternoon' | '3_Evening' | '4_Off Hours';
export type NriStatus = 'India' | 'NRI';
export type ActionNeeded = 'ESCALATE' | 'MOVE_TO_PSV' | 'CALL_NOW' | 'REASSIGN' | 'DEPRIORITIZE' | 'ON_TRACK';
export type InsightCategory = 'positive' | 'suggestion' | 'warning';
export type DashboardMode = 'demo' | 'live';

// ---- Insight / API types ----
export interface Insight {
  id: string;
  category: InsightCategory;
  headline: string;
  detail: string;
  dataTrail: DataPoint[];
  suggestion: string;
  projectedImpact: ProjectedImpact | null;
  priority: number; // 1 = highest
  sourceTable: string;
  segment: string;
}

export interface DataPoint {
  label: string;
  value: number | string;
  context: string;
}

export interface ProjectedImpact {
  metric: string;
  currentValue: number;
  projectedValue: number;
  confidence: 'high' | 'medium' | 'low';
  basis: string;
}

export interface HealthPulseData {
  pacing: HealthMetric;
  pickup: HealthMetric;
  handoff: HealthMetric;
}

export interface HealthMetric {
  label: string;
  value: number | string;
  trend: 'up' | 'down' | 'stable';
  status: 'good' | 'warning' | 'critical';
  vsLandmark: string;
  vsBroadway: string;
  detail: string;
}

export interface SuggestionItem {
  id: string;
  ifCondition: string;
  thenImpact: string;
  confidence: 'high' | 'medium' | 'low';
  basedOn: string;
  currentValue: number;
  projectedValue: number;
  conservativeValue: number;
  metric: string;
}

export interface DashboardState {
  mode: DashboardMode;
  currentCampaignDay: number | null;
  tablesLoaded: string[];
  lastRefresh: string;
  insights: Insight[];
  healthPulse: HealthPulseData;
  suggestions: SuggestionItem[];
}

// ---- All tables container ----
export interface AllTablesData {
  t1: T1CallingMetrics[];
  t2: T2CohortConversion[];
  t3: T3ScoreThreshold[];
  t4: T4PresalesPerformance[];
  t5: T5HandoffQuality[];
  t6: T6LeadSignals[];
  t7: T7CampaignVelocity[];
}

export interface LoadedData {
  benchmark: AllTablesData;
  legacy: Partial<AllTablesData> | null;
  mode: DashboardMode;
  currentCampaignDay: number | null;
  lastRefresh: string;
}
