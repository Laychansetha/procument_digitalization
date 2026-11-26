#!/bin/bash
# =============================================================================
# IBIS RICE Procurement System — 1-Command Production Rollback Script
# Usage:
#   bash scripts/rollback.sh              # Roll back to previous working commit
#   bash scripts/rollback.sh <commit-sha> # Roll back to a specific git commit
# =============================================================================

set -euo pipefail

APP_DIR="${APP_DIR:-/home/ec2-user/ibis-app}"
APP_NAME="ibis-app"
HEALTH_URL="http://127.0.0.1:3000/api/health"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log()     { echo -e "${BLUE}[ROLLBACK]${NC} $1"; }
success() { echo -e "${GREEN}[✓]${NC} $1"; }
warn()    { echo -e "${YELLOW}[!]${NC} $1"; }
fail()    { echo -e "${RED}[✗]${NC} $1"; exit 1; }

cd "$APP_DIR"

if [ -n "${1:-}" ]; then
  TARGET_COMMIT="$1"
elif [ -f "$APP_DIR/.rollback_commit" ]; then
  TARGET_COMMIT=$(cat "$APP_DIR/.rollback_commit")
elif [ -f "$APP_DIR/.prev_deploy_commit" ]; then
  TARGET_COMMIT=$(cat "$APP_DIR/.prev_deploy_commit")
else
  fail "No rollback commit found. Specify one explicitly: bash scripts/rollback.sh <commit-sha>"
fi

log "Rolling back $APP_NAME to commit: $TARGET_COMMIT"

if [ -f "$APP_DIR/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$APP_DIR/.env"
  set +a
fi

git fetch origin
git reset --hard "$TARGET_COMMIT"

# Reuse saved .next_prev snapshot if rolling back to the immediate previous deploy
SAVED_PREV=""
if [ -f "$APP_DIR/.rollback_commit" ]; then
  SAVED_PREV=$(cat "$APP_DIR/.rollback_commit")
fi

npm ci
npx prisma generate

if [ "$TARGET_COMMIT" = "$SAVED_PREV" ] && [ -d "$APP_DIR/.next_prev" ]; then
  log "Restoring saved .next_prev build snapshot..."
  rm -rf "$APP_DIR/.next"
  cp -a "$APP_DIR/.next_prev" "$APP_DIR/.next"
else
  log "Rebuilding Next.js bundle for commit $TARGET_COMMIT (low CPU priority)..."
  nice -n 10 env NODE_OPTIONS="--max-old-space-size=1024" npm run build
fi

pm2 restart "$APP_NAME" --update-env

log "Verifying health at $HEALTH_URL..."
HEALTH_OK=false
for i in $(seq 1 15); do
  if curl -fsS "$HEALTH_URL" | grep -q '"status":"ok"'; then
    HEALTH_OK=true
    break
  fi
  sleep 2
done

if [ "$HEALTH_OK" = true ]; then
  success "Rollback complete! Active commit: $(git log -1 --format='%h — %s')"
else
  fail "Application restarted but failed health check. Inspect logs: pm2 logs $APP_NAME"
fi

echo ""
warn "Note: Live PostgreSQL data was NOT overwritten during code rollback."
warn "If you also need to restore a database backup, run:"
echo "  ls -lh $APP_DIR/backups/"
echo "  psql \"\$DATABASE_URL\" < $APP_DIR/backups/<backup_file>.sql"
echo ""
