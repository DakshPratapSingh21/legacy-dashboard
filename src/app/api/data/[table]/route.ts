import { NextRequest, NextResponse } from 'next/server';
import { loadData } from '@/lib/data-loader';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: { table: string } }
) {
  // --- Data protection: require API_SECRET header in production ---
  // This endpoint exposes raw CSV data. In production it is locked behind
  // a secret so no one can scrape your lead-level data from the public URL.
  const secret = process.env.API_SECRET;
  if (secret) {
    const provided = request.headers.get('x-api-secret');
    if (provided !== secret) {
      return NextResponse.json(
        { error: 'Unauthorized — this endpoint requires an API secret.' },
        { status: 401 }
      );
    }
  }

  try {
    const data = await loadData();
    const { searchParams } = new URL(request.url);
    const table = context.params.table;
    const project = searchParams.get('project');
    const dayFrom = searchParams.get('day_from');
    const dayTo = searchParams.get('day_to');
    const scoreBucket = searchParams.get('score_bucket');
    const leadType = searchParams.get('lead_type');
    const timeSlot = searchParams.get('time_slot');

    type TableKey = 't1' | 't2' | 't3' | 't4' | 't5' | 't6' | 't7';
    const tableKey = table as TableKey;

    // Get data from the right source
    let rows: Record<string, unknown>[] = [];
    const benchmarkData = data.benchmark[tableKey];
    const legacyData = data.legacy?.[tableKey];

    if (benchmarkData) {
      rows = [...(benchmarkData as unknown as Record<string, unknown>[])];
    }
    if (legacyData) {
      rows = [...rows, ...(legacyData as unknown as Record<string, unknown>[])];
    }

    if (rows.length === 0) {
      return NextResponse.json({ error: `Table ${table} not found` }, { status: 404 });
    }

    // Apply filters
    if (project) {
      rows = rows.filter((r) => String(r.project).toUpperCase() === project.toUpperCase());
    }
    if (dayFrom) {
      const from = parseInt(dayFrom);
      rows = rows.filter((r) => (r.campaign_day as number) >= from);
    }
    if (dayTo) {
      const to = parseInt(dayTo);
      rows = rows.filter((r) => (r.campaign_day as number) <= to);
    }
    if (scoreBucket) {
      rows = rows.filter((r) =>
        String(r.score_bucket || r.score_bucket_at_call) === scoreBucket
      );
    }
    if (leadType) {
      rows = rows.filter((r) => String(r.lead_type) === leadType);
    }
    if (timeSlot) {
      rows = rows.filter((r) => String(r.time_slot) === timeSlot);
    }

    return NextResponse.json({
      table,
      count: rows.length,
      data: rows.slice(0, 5000),
    });
  } catch (error) {
    console.error('Data API error:', error);
    return NextResponse.json(
      { error: 'Failed to load data', detail: String(error) },
      { status: 500 }
    );
  }
}
