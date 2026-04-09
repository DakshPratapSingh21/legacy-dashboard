import { NextResponse } from 'next/server';
import { loadData, getLoadedTableNames } from '@/lib/data-loader';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await loadData();
    const tables = getLoadedTableNames(data);

    return NextResponse.json({
      status: 'ok',
      mode: data.mode,
      currentCampaignDay: data.currentCampaignDay,
      tablesLoaded: tables,
      tableCount: tables.length,
      lastRefresh: data.lastRefresh,
      metabaseConnected: !!process.env.METABASE_URL,
    });
  } catch (error) {
    console.error('Health API error:', error);
    return NextResponse.json(
      { status: 'error', error: String(error) },
      { status: 500 }
    );
  }
}
