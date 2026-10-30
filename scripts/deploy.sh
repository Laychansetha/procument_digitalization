#!/bin/bash
# =============================================================================
# IBIS RICE Procurement System — Amazon Linux Production Deploy Script
# Runs ON the Lightsail VPS (Amazon Linux 2023), executed via SSH or CI/CD.
#
# Target Subdomain: procurement.icsserver.com
# Port: 3000
# Database: PostgreSQL (database: ibis_db)
# =============================================================================

set -e  # Exit immediately if ANY command fails

# ─── Configuration ───────────────────────────────────────────────────────────
APP_DIR="/home/ec2-user/ibis-app"
APP_NAME="ibis-app"
BACKUP_DIR="$APP_DIR/backups"
KEEP_BACKUPS=7  # Retain last 7 database backups

# ─── Colours ─────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log()    { echo -e "${BLUE}[DEPLOY]${NC} $1"; }
success(){ echo -e "${GREEN}[✓]${NC} $1"; }
warn()   { echo -e "${YELLOW}[!]${NC} $1"; }
error()  { echo -e "${RED}[✗]${NC} $1"; exit 1; }

echo ""
log "============================================================"
log "  IBIS RICE — Production Deploy Started: $(date '+%Y-%m-%d %H:%M:%S')"
log "============================================================"
echo ""

# ─── Step 1: Check & Load Environment ───────────────────────────────────────
log "Step 1/8 — Loading environment configuration..."
if [ ! -f "$APP_DIR/.env" ]; then
  error ".env file missing at $APP_DIR/.env! Cannot deploy."
fi
set -a
# shellcheck disable=SC1091
source "$APP_DIR/.env"
set +a
success "Environment configuration loaded."

# ─── Step 2: Fetch & Reset Code ──────────────────────────────────────────────
log "Step 2/8 — Pulling latest code..."
cd "$APP_DIR"
git fetch origin main
git reset --hard origin/main
success "Updated to commit: $(git log -1 --format='%h — %s')"

# ─── Step 3: Install Production Dependencies ────────────────────────────────
log "Step 3/8 — Installing production dependencies..."
npm install
success "Dependencies installed."

# ─── Step 4: Generate Prisma Client ──────────────────────────────────────────
log "Step 4/8 — Generating Prisma Client..."
npx prisma generate
success "Prisma Client generated."

# ─── Step 5: Backup Database ─────────────────────────────────────────────────
log "Step 5/8 — Backing up PostgreSQL database..."
mkdir -p "$BACKUP_DIR"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/ibis_db_backup_${TIMESTAMP}.sql"

if pg_dump "$DATABASE_URL" > "$BACKUP_FILE" 2>/dev/null; then
  BACKUP_SIZE=$(du -sh "$BACKUP_FILE" | cut -f1)
  success "Database backup created: $BACKUP_FILE ($BACKUP_SIZE)"
else
  warn "pg_dump failed or postgresql client tools not present. Skipping backup."
fi

# Clean old backups beyond retention count
BACKUP_COUNT=$(ls "$BACKUP_DIR"/*.sql 2>/dev/null | wc -l)
if [ "$BACKUP_COUNT" -gt "$KEEP_BACKUPS" ]; then
  ls -t "$BACKUP_DIR"/*.sql | tail -n +"$((KEEP_BACKUPS + 1))" | xargs rm -f
  success "Old backups cleaned (kept last $KEEP_BACKUPS)."
fi

# ─── Step 6: Sync Prisma Database Schema ─────────────────────────────────────
log "Step 6/8 — Syncing Prisma database schema to PostgreSQL..."
npx prisma db push
mkdir -p "$APP_DIR/public/uploads"
success "Database schema synced and uploads directory verified."

# ─── Step 7: Build Next.js Application ───────────────────────────────────────
log "Step 7/8 — Building Next.js application..."
npm run build
success "Next.js production build finished."

# ─── Step 8: Manage PM2 Process ──────────────────────────────────────────────
log "Step 8/8 — Restarting PM2 process..."
if pm2 describe "$APP_NAME" > /dev/null 2>&1; then
  pm2 restart "$APP_NAME" --update-env
  success "Application process restarted ($APP_NAME)."
else
  if [ -f "ecosystem.config.js" ]; then
    pm2 start ecosystem.config.js
  else
    pm2 start npm --name "$APP_NAME" -- start
  fi
  pm2 save
  success "Application started for the first time ($APP_NAME)."
fi

echo ""
log "============================================================"
success "  IBIS RICE Deployment Complete: $(date '+%Y-%m-%d %H:%M:%S')"
log "============================================================"
log "Target Subdomain: https://procurement.icsserver.com"
log "Check logs with:  pm2 logs $APP_NAME"
log "Check status:     pm2 status"
echo ""
