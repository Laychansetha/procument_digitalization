#!/bin/bash
# =============================================================================
# IBIS RICE Procurement System — Safe Production Deploy Script (Lightsail)
# Runs ON the Amazon Lightsail VPS (Amazon Linux 2023), via SSH or GitHub CD.
#
# Safety features:
#   - Mandatory verified pg_dump backup BEFORE any schema change (aborts on failure)
#   - Builds Next.js BEFORE migrating DB or restarting PM2
#   - Saves previous working commit + .next build for instant rollback
#   - Probes /api/health after PM2 restart and AUTO-ROLLS BACK on failure
# =============================================================================

set -euo pipefail

# ─── Configuration ───────────────────────────────────────────────────────────
APP_DIR="${APP_DIR:-/home/ec2-user/ibis-app}"
APP_NAME="ibis-app"
BRANCH="main"
BACKUP_DIR="$APP_DIR/backups"
KEEP_BACKUPS=10
HEALTH_URL="http://127.0.0.1:3000/api/health"
HEALTH_RETRIES=15
HEALTH_DELAY_SEC=2

# ─── Colours & Logging ───────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log()     { echo -e "${BLUE}[DEPLOY]${NC} $1"; }
success() { echo -e "${GREEN}[✓]${NC} $1"; }
warn()    { echo -e "${YELLOW}[!]${NC} $1"; }
fail()    { echo -e "${RED}[✗]${NC} $1"; }

PREV_COMMIT=""
DEPLOY_MODIFIED_CODE=false

check_health() {
  for i in $(seq 1 "$HEALTH_RETRIES"); do
    if curl -fsS "$HEALTH_URL" | grep -q '"status":"ok"'; then
      return 0
    fi
    sleep "$HEALTH_DELAY_SEC"
  done
  return 1
}

rollback_release() {
  warn "Deployment failed! Starting automatic rollback to previous working release..."
  if [ "$DEPLOY_MODIFIED_CODE" = true ] && [ -n "$PREV_COMMIT" ]; then
    cd "$APP_DIR"
    git reset --hard "$PREV_COMMIT" || true
    if [ -d "$APP_DIR/.next_prev" ]; then
      rm -rf "$APP_DIR/.next"
      cp -a "$APP_DIR/.next_prev" "$APP_DIR/.next"
      success "Restored previous .next build."
    fi
    npm ci --prefer-offline || npm ci || true
    npx prisma generate || true
    if pm2 describe "$APP_NAME" > /dev/null 2>&1; then
      pm2 restart "$APP_NAME" --update-env || true
    fi
    if check_health; then
      success "Rollback complete — previous version ($PREV_COMMIT) is healthy and online."
    else
      fail "Rollback health check failed! Inspect logs immediately: pm2 logs $APP_NAME"
    fi
  fi
  exit 1
}

echo ""
log "============================================================"
log "  IBIS RICE — Production Deploy Started: $(date '+%Y-%m-%d %H:%M:%S')"
log "============================================================"
echo ""

# ─── Step 1: Load & Validate Environment ─────────────────────────────────────
log "Step 1/9 — Loading production environment configuration..."
if [ ! -f "$APP_DIR/.env" ]; then
  fail ".env file missing at $APP_DIR/.env! Aborting."
  exit 1
fi
set -a
# shellcheck disable=SC1091
source "$APP_DIR/.env"
set +a

if [ -z "${DATABASE_URL:-}" ]; then
  fail "DATABASE_URL is not set in $APP_DIR/.env! Aborting."
  exit 1
fi
if [ -z "${NEXTAUTH_SECRET:-}" ]; then
  warn "NEXTAUTH_SECRET is not set in .env — strongly recommended for production!"
fi
success "Environment configuration loaded."

# ─── Step 2: Snapshot Current Working Release (for Rollback) ─────────────────
log "Step 2/9 — Snapshotting current working commit and build..."
cd "$APP_DIR"
PREV_COMMIT=$(git rev-parse HEAD)
echo "$PREV_COMMIT" > "$APP_DIR/.prev_deploy_commit"

if [ -d "$APP_DIR/.next" ]; then
  rm -rf "$APP_DIR/.next_prev"
  cp -a "$APP_DIR/.next" "$APP_DIR/.next_prev"
  success "Saved previous commit ($PREV_COMMIT) and .next snapshot for rollback."
else
  warn "No existing .next directory found (first build)."
fi

# ─── Step 3: Mandatory PostgreSQL Database Backup ────────────────────────────
log "Step 3/9 — Creating mandatory PostgreSQL backup..."
mkdir -p "$BACKUP_DIR"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/ibis_db_backup_${TIMESTAMP}.sql"

if ! command -v pg_dump > /dev/null 2>&1; then
  fail "pg_dump is not installed! Install postgresql15 before running automated deploys."
  exit 1
fi

if pg_dump "$DATABASE_URL" > "$BACKUP_FILE" && [ -s "$BACKUP_FILE" ]; then
  BACKUP_SIZE=$(du -sh "$BACKUP_FILE" | cut -f1)
  success "Verified database backup created: $BACKUP_FILE ($BACKUP_SIZE)"
else
  rm -f "$BACKUP_FILE"
  fail "Database backup failed! Aborting deployment before modifying code or database."
  exit 1
fi

# Retain last N backups
BACKUP_COUNT=$(find "$BACKUP_DIR" -maxdepth 1 -name 'ibis_db_backup_*.sql' | wc -l)
if [ "$BACKUP_COUNT" -gt "$KEEP_BACKUPS" ]; then
  ls -t "$BACKUP_DIR"/ibis_db_backup_*.sql | tail -n +"$((KEEP_BACKUPS + 1))" | xargs rm -f
  success "Cleaned old backups (retained last $KEEP_BACKUPS)."
fi

# ─── Step 4: Pull Verified Commit from GitHub ────────────────────────────────
log "Step 4/9 — Fetching latest verified commit from origin/$BRANCH..."
git fetch origin "$BRANCH"
NEW_COMMIT=$(git rev-parse "origin/$BRANCH")
DEPLOY_MODIFIED_CODE=true
git reset --hard "$NEW_COMMIT" || rollback_release
success "Checked out commit: $(git log -1 --format='%h — %s')"

# ─── Step 5: Install Locked Dependencies & Generate Prisma Client ────────────
log "Step 5/9 — Installing dependencies (npm ci) and generating Prisma Client..."
npm ci || rollback_release
npx prisma generate || rollback_release
success "Dependencies installed and Prisma Client generated."

# ─── Step 6: Build Next.js Application (BEFORE DB Migration or Restart) ──────
log "Step 6/9 — Building Next.js production bundle (low CPU priority to protect co-hosted services)..."
nice -n 10 env NODE_OPTIONS="--max-old-space-size=1024" npm run build || rollback_release
success "Next.js production build succeeded."

# ─── Step 7: Apply Safe Prisma Database Migrations ───────────────────────────
log "Step 7/9 — Applying safe Prisma database migrations (prisma migrate deploy)..."
mkdir -p "$APP_DIR/public/uploads"
npx prisma migrate deploy || rollback_release
success "Database migrations up to date and uploads directory verified."

# ─── Step 8: Restart PM2 Application Process ─────────────────────────────────
log "Step 8/9 — Restarting PM2 process ($APP_NAME)..."
if pm2 describe "$APP_NAME" > /dev/null 2>&1; then
  pm2 restart "$APP_NAME" --update-env || rollback_release
  success "PM2 process restarted ($APP_NAME)."
else
  if [ -f "$APP_DIR/ecosystem.config.js" ]; then
    pm2 start "$APP_DIR/ecosystem.config.js" || rollback_release
  else
    pm2 start npm --name "$APP_NAME" -- start || rollback_release
  fi
  pm2 save
  success "PM2 process started ($APP_NAME)."
fi

# ─── Step 9: Post-Deploy Health Verification (Auto-Rollback on Failure) ──────
log "Step 9/9 — Verifying application & database health ($HEALTH_URL)..."
if check_health; then
  echo "$PREV_COMMIT" > "$APP_DIR/.rollback_commit"
  success "Health check passed (HTTP 200 + PostgreSQL connected)!"
else
  fail "Health check failed after $((HEALTH_RETRIES * HEALTH_DELAY_SEC))s!"
  rollback_release
fi

echo ""
log "============================================================"
success "  IBIS RICE Deployment Complete: $(date '+%Y-%m-%d %H:%M:%S')"
log "============================================================"
log "Active Commit:    $(git log -1 --format='%h — %s')"
log "Rollback Target:  $PREV_COMMIT (run: bash scripts/rollback.sh)"
log "Latest DB Backup: $BACKUP_FILE"
log "Target URL:       https://procurement.icsserver.com"
echo ""
