'use client';

import { useState } from 'react';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts';
import { Info } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { SCORE_BUCKET_LABELS, SCORE_BUCKET_LEGEND } from '@/lib/labels';

/* =================================================================
   Evidence Charts — plain English, theme-aware, unique-leads-based
   No PSV/SV/FB jargon in any user-visible text.
   ================================================================= */

function getColors(theme: string) {
  if (theme === 'dark') {
    return {
      landmark: '#6B82E8', broadway: '#D4A745', legacy: '#1E9B52',
      grid: '#262D3D', textMuted: '#707A8C',
      tooltipBg: '#1A2033', tooltipBorder: '#2A3348', tooltipText: '#F0F1F4',
    };
  }
  return {
    landmark: '#4560C9', broadway: '#B8882A', legacy: '#157A3E',
    grid: '#E5E7EB', textMuted: '#6B7280',
    tooltipBg: '#FFFFFF', tooltipBorder: '#E5E7EB', tooltipText: '#1C1F26',
  };
}

function InfoButton({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  return (
    <button
      className="relative inline-flex items-center justify-center w-4 h-4 ml-1.5 rounded-full"
      style={{ color: 'var(--text-disabled)' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      aria-label="More info"
    >
      <Info className="w-3 h-3" />
      {show && (
        <div
          className="absolute bottom-full left-0 mb-2 w-56 p-2.5 rounded-md text-[10px] leading-relaxed z-50 anim-fade whitespace-pre-line"
          style={{
            background: 'var(--tooltip-bg)', color: 'var(--tooltip-text)',
            border: '1px solid var(--tooltip-border)', boxShadow: 'var(--shadow-lg)',
          }}
        >
          {text}
        </div>
      )}
    </button>
  );
}

// ---- Cumulative Progress Chart (T7) ----

interface VelocityChartProps {
  landmark: { day: number; fb: number; psv: number; leadsCalled: number }[];
  broadway: { day: number; fb: number; psv: number; leadsCalled: number }[];
  legacy: { day: number; fb: number; psv: number; leadsCalled: number }[] | null;
  metric: 'fb' | 'psv' | 'leadsCalled';
  title: string;
}

export function VelocityChart({ landmark, broadway, legacy, metric, title }: VelocityChartProps) {
  const { theme } = useTheme();
  const C = getColors(theme);

  const dayMap = new Map<number, Record<string, number>>();
  for (const row of landmark) { const e = dayMap.get(row.day) || {}; e[`landmark_${metric}`] = row[metric]; e.day = row.day; dayMap.set(row.day, e); }
  for (const row of broadway) { const e = dayMap.get(row.day) || {}; e[`broadway_${metric}`] = row[metric]; e.day = row.day; dayMap.set(row.day, e); }
  if (legacy) { for (const row of legacy) { const e = dayMap.get(row.day) || {}; e[`legacy_${metric}`] = row[metric]; e.day = row.day; dayMap.set(row.day, e); } }
  const chartData = Array.from(dayMap.values()).sort((a, b) => a.day - b.day);

  const metricLabels: Record<string, string> = { fb: 'Flats Blocked', psv: 'Visits Scheduled', leadsCalled: 'Unique Leads Called' };
  const ts = { fontSize: 10, fill: C.textMuted, fontFamily: 'DM Sans' };
  const tt = { backgroundColor: C.tooltipBg, border: `1px solid ${C.tooltipBorder}`, borderRadius: '8px', fontSize: '11px', padding: '10px 12px', color: C.tooltipText };

  return (
    <ChartWrapper title={title} subtitle={`Cumulative ${metricLabels[metric]} over time`}>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={C.grid} vertical={false} />
          <XAxis dataKey="day" tick={ts} axisLine={{ stroke: C.grid }} tickLine={false} />
          <YAxis tick={ts} axisLine={false} tickLine={false} width={40} />
          <Tooltip contentStyle={tt} labelFormatter={(v) => `Day ${v}`} />
          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} iconType="circle" iconSize={6} />
          <Line type="monotone" dataKey={`landmark_${metric}`} name="Landmark" stroke={C.landmark} strokeWidth={2} dot={false} connectNulls />
          <Line type="monotone" dataKey={`broadway_${metric}`} name="Broadway" stroke={C.broadway} strokeWidth={2} dot={false} connectNulls />
          {legacy && <Line type="monotone" dataKey={`legacy_${metric}`} name="Legacy" stroke={C.legacy} strokeWidth={2.5} dot={false} connectNulls />}
        </LineChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
}

// ---- Lead Quality Score Chart (T3) ----

interface ScoreBucketChartProps {
  data: { scoreBucket: string; project: string; fbPer100: number; convRatePsv: number }[];
  title: string;
}

export function ScoreBucketChart({ data, title }: ScoreBucketChartProps) {
  const { theme } = useTheme();
  const C = getColors(theme);

  const buckets = [...new Set(data.map((d) => d.scoreBucket))];
  const chartData = buckets.map((bucket) => {
    const entry: Record<string, string | number> = {
      bucket: SCORE_BUCKET_LABELS[bucket] || bucket,
      rawBucket: bucket,
    };
    for (const row of data.filter((d) => d.scoreBucket === bucket)) {
      const proj = row.project.toUpperCase();
      entry[`${proj}_fb`] = parseFloat(row.fbPer100.toFixed(2));
    }
    return entry;
  });

  const ts = { fontSize: 10, fill: C.textMuted, fontFamily: 'DM Sans' };
  const tt = { backgroundColor: C.tooltipBg, border: `1px solid ${C.tooltipBorder}`, borderRadius: '8px', fontSize: '11px', padding: '10px 12px', color: C.tooltipText };

  return (
    <ChartWrapper
      title={title}
      subtitle="Bookings per 100 unique leads, by lead quality score"
      info={SCORE_BUCKET_LEGEND}
    >
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }} barGap={2}>
          <CartesianGrid strokeDasharray="3 3" stroke={C.grid} vertical={false} />
          <XAxis dataKey="bucket" tick={{ ...ts, fontSize: 9 }} axisLine={{ stroke: C.grid }} tickLine={false} angle={-15} textAnchor="end" height={45} />
          <YAxis tick={ts} axisLine={false} tickLine={false} width={40} />
          <Tooltip contentStyle={tt} />
          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} iconType="circle" iconSize={6} />
          <Bar dataKey="LANDMARK_fb" name="Landmark" fill={C.landmark} radius={[3, 3, 0, 0]} maxBarSize={32} />
          <Bar dataKey="BROADWAY_fb" name="Broadway" fill={C.broadway} radius={[3, 3, 0, 0]} maxBarSize={32} />
        </BarChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
}

// ---- Time-of-Day Chart ----

interface CallingPatternChartProps {
  landmark: { timeSlot: string; pickupRate: number; convRatePsv: number; totalCalls: number }[];
  broadway: { timeSlot: string; pickupRate: number; convRatePsv: number; totalCalls: number }[];
  title: string;
}

export function CallingPatternChart({ landmark, broadway, title }: CallingPatternChartProps) {
  const { theme } = useTheme();
  const C = getColors(theme);

  const slotLabels: Record<string, string> = {
    '1_Morning': 'Morning (6am–12pm)',
    '2_Afternoon': 'Afternoon (12–5pm)',
    '3_Evening': 'Evening (5–9pm)',
    '4_Off Hours': 'Off Hours',
  };

  const slots = [...new Set([...landmark.map((l) => l.timeSlot), ...broadway.map((b) => b.timeSlot)])];
  const chartData = slots.map((slot) => {
    const l = landmark.find((r) => r.timeSlot === slot);
    const b = broadway.find((r) => r.timeSlot === slot);
    return {
      slot: slotLabels[slot] || slot.replace(/^\d_/, ''),
      landmark_pickup: l ? parseFloat((l.pickupRate * 100).toFixed(1)) : 0,
      broadway_pickup: b ? parseFloat((b.pickupRate * 100).toFixed(1)) : 0,
    };
  });

  const ts = { fontSize: 10, fill: C.textMuted, fontFamily: 'DM Sans' };
  const tt = { backgroundColor: C.tooltipBg, border: `1px solid ${C.tooltipBorder}`, borderRadius: '8px', fontSize: '11px', padding: '10px 12px', color: C.tooltipText };

  return (
    <ChartWrapper title={title} subtitle="What % of leads pick up the phone, by time of day">
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }} barGap={2}>
          <CartesianGrid strokeDasharray="3 3" stroke={C.grid} vertical={false} />
          <XAxis dataKey="slot" tick={{ ...ts, fontSize: 9 }} axisLine={{ stroke: C.grid }} tickLine={false} />
          <YAxis tick={ts} axisLine={false} tickLine={false} width={40} />
          <Tooltip contentStyle={tt} formatter={(value: number) => [`${value}%`, 'Connection Rate']} />
          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} iconType="circle" iconSize={6} />
          <Bar dataKey="landmark_pickup" name="Landmark" fill={C.landmark} radius={[3, 3, 0, 0]} maxBarSize={36} />
          <Bar dataKey="broadway_pickup" name="Broadway" fill={C.broadway} radius={[3, 3, 0, 0]} maxBarSize={36} />
        </BarChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
}

// ---- Follow-Through Chart ----

interface HandoffChartProps {
  landmark: { week: number; rate: number }[];
  broadway: { week: number; rate: number }[];
  title: string;
}

export function HandoffChart({ landmark, broadway, title }: HandoffChartProps) {
  const { theme } = useTheme();
  const C = getColors(theme);

  const weekMap = new Map<number, Record<string, number>>();
  for (const r of landmark) { const e = weekMap.get(r.week) || {}; e.landmark = parseFloat((r.rate * 100).toFixed(1)); e.week = r.week; weekMap.set(r.week, e); }
  for (const r of broadway) { const e = weekMap.get(r.week) || {}; e.broadway = parseFloat((r.rate * 100).toFixed(1)); e.week = r.week; weekMap.set(r.week, e); }
  const chartData = Array.from(weekMap.values()).sort((a, b) => a.week - b.week);

  const ts = { fontSize: 10, fill: C.textMuted, fontFamily: 'DM Sans' };
  const tt = { backgroundColor: C.tooltipBg, border: `1px solid ${C.tooltipBorder}`, borderRadius: '8px', fontSize: '11px', padding: '10px 12px', color: C.tooltipText };

  return (
    <ChartWrapper
      title={title}
      subtitle="Of leads who scheduled a visit, what % actually visited? (by week)"
      info="Follow-through rate measures how well the sales team converts a scheduled visit into an actual site visit. Low rates may mean follow-up calls are missing."
    >
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={C.grid} vertical={false} />
          <XAxis dataKey="week" tick={ts} axisLine={{ stroke: C.grid }} tickLine={false} />
          <YAxis tick={ts} axisLine={false} tickLine={false} width={40} />
          <Tooltip contentStyle={tt} labelFormatter={(v) => `Week ${v}`} formatter={(value: number, name: string) => [`${value}%`, name]} />
          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} iconType="circle" iconSize={6} />
          <Line type="monotone" dataKey="landmark" name="Landmark" stroke={C.landmark} strokeWidth={2} dot={{ r: 2, fill: C.landmark }} />
          <Line type="monotone" dataKey="broadway" name="Broadway" stroke={C.broadway} strokeWidth={2} dot={{ r: 2, fill: C.broadway }} />
        </LineChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
}

// ---- Shared wrapper with optional info button ----

function ChartWrapper({ title, subtitle, info, children }: { title: string; subtitle: string; info?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg p-5" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
      <div className="mb-4">
        <div className="flex items-center">
          <h3 className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-disabled)', letterSpacing: '0.08em' }}>Evidence</h3>
          {info && <InfoButton text={info} />}
        </div>
        <p className="text-sm font-medium mt-1" style={{ color: 'var(--text-secondary)' }}>{title}</p>
        <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-disabled)' }}>{subtitle}</p>
      </div>
      {children}
    </div>
  );
}
