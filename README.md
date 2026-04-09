# ASBL Pre-Sales Intelligence Dashboard

A production-ready analytics dashboard that compares a live real estate pre-sales campaign (Legacy) against two completed benchmark campaigns (Landmark and Broadway).

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Adding Data

### Benchmark Data (required)
Place CSV files in `data/benchmark/`:
- `t1_calling_metrics.csv`
- `t2_cohort_conversion.csv`
- `t3_score_threshold_performance.csv`
- `t4_presales_performance.csv`
- `t5_handoff_quality.csv`
- `t6_lead_level_signals.csv`
- `t7_campaign_velocity.csv`

### Legacy Data (optional — enables live mode)
Place CSV files in `data/legacy/` with the same filenames.

## Deployment

### Vercel (recommended)
1. Push to GitHub
2. Import at [vercel.com](https://vercel.com)
3. Deploy — Vercel auto-detects Next.js

### Environment Variables (optional)
- `METABASE_URL` — Metabase instance URL
- `METABASE_TOKEN` — Metabase API session token

## Architecture

- **Data Loader** — reads CSVs or Metabase API
- **Statistical Engine** — z-tests, decomposition, pacing analysis
- **Insight Generator** — plain English insights with actions
- **API Routes** — decoupled for frontend flexibility

## API Endpoints

- `GET /api/insights` — all insights, health pulse, suggestions
- `GET /api/data/[table]` — filtered table data
- `GET /api/health` — system status

## Tech Stack

Next.js 14, TypeScript, Tailwind CSS, Recharts, Papa Parse
