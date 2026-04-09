#!/bin/bash
# refresh-legacy.sh — Exports Legacy tables to CSV files
# Schedule with cron: */30 * * * * /path/to/refresh-legacy.sh
#
# Usage:
#   ./scripts/refresh-legacy.sh
#
# Prerequisites:
#   - METABASE_URL and METABASE_TOKEN environment variables set
#   - OR: DATABASE_URL for direct SQL export
#   - curl and jq installed

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LEGACY_DIR="$PROJECT_DIR/data/legacy"

mkdir -p "$LEGACY_DIR"

echo "[$(date)] Starting Legacy data refresh..."

# Option 1: Metabase API export
if [[ -n "${METABASE_URL:-}" && -n "${METABASE_TOKEN:-}" ]]; then
  echo "Using Metabase API..."

  # Map table names to Metabase card IDs
  declare -A CARD_IDS=(
    ["t1_calling_metrics"]="${MB_CARD_T1_LEGACY:-0}"
    ["t2_cohort_conversion"]="${MB_CARD_T2_LEGACY:-0}"
    ["t3_score_threshold_performance"]="${MB_CARD_T3_LEGACY:-0}"
    ["t4_presales_performance"]="${MB_CARD_T4_LEGACY:-0}"
    ["t5_handoff_quality"]="${MB_CARD_T5_LEGACY:-0}"
    ["t6_lead_level_signals"]="${MB_CARD_T6_LEGACY:-0}"
    ["t7_campaign_velocity"]="${MB_CARD_T7_LEGACY:-0}"
  )

  for table in "${!CARD_IDS[@]}"; do
    card_id="${CARD_IDS[$table]}"
    if [[ "$card_id" != "0" ]]; then
      echo "  Exporting $table (card $card_id)..."
      curl -s -H "X-Metabase-Session: $METABASE_TOKEN" \
        "$METABASE_URL/api/card/$card_id/query/csv" \
        -o "$LEGACY_DIR/${table}.csv"
      echo "  Done: $(wc -l < "$LEGACY_DIR/${table}.csv") rows"
    fi
  done

# Option 2: Direct database export (requires psql)
elif [[ -n "${DATABASE_URL:-}" ]]; then
  echo "Using direct database export..."
  # Add your SQL export commands here
  # Example:
  # psql "$DATABASE_URL" -c "COPY (SELECT * FROM t1_legacy) TO STDOUT CSV HEADER" > "$LEGACY_DIR/t1_calling_metrics.csv"
  echo "Direct DB export not yet configured. Add SQL commands to this script."
else
  echo "ERROR: No data source configured."
  echo "Set METABASE_URL + METABASE_TOKEN or DATABASE_URL"
  exit 1
fi

# Touch refresh marker
touch "$LEGACY_DIR/.last-refresh"

echo "[$(date)] Legacy data refresh complete."
echo "Files in $LEGACY_DIR:"
ls -la "$LEGACY_DIR"
