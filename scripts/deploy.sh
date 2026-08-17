#!/bin/bash
# =============================================================================
# IBIS RICE — Production Deploy Script
# Runs ON the Lightsail app server, called remotely by GitHub Actions via SSH.
#
# Architecture:
#   App Server:  Lightsail Instance 1 — Node.js (ec2-user @ 13.251.56.200)
#   DB Server:   Lightsail Instance 2 — PostgreSQL (separate internal IP)
#
# Prerequisites (one-time setup, see VPS_SETUP_GUIDE.md):
#   - Git repository cloned at $APP_DIR
#   - .env file present at $APP_DIR/.env with DATABASE_URL pointing to Lightsail DB
#   - pm2 installed globally: npm install -g pm2
#   - postgresql-client installed: sudo apt-get install -y postgresql-client
# =============================================================================

set -e  # Exit immediately if ANY command fails — prevents partial deploys

# ─── Configuration ───────────────────────────────────────────────────────────
APP_DIR="/home/ec2-user/ibis-app"
APP_NAME="ibis-app"
BACKUP_DIR="$APP_DIR/backups"
KEEP_BACKUPS=7  # Number of database backups to retain

# ─── Colours for readable output ─────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No colour

log()    { echo -e "${BLUE}[DEPLOY]${NC} $1"; }
success(){ echo -e "${GREEN}[✓]${NC} $1"; }
warn()   { echo -e "${YELLOW}[!]${NC} $1"; }
error()  { echo -e "${RED}[✗]${NC} $1"; exit 1; }

# =============================================================================
echo ""
log "============================================================"
log "  IBIS RICE — Deploy Started at $(date '+%Y-%m-%d %H:%M:%S')"
log "============================================================"
echo ""

# ─── Step 1: Load environment variables from .env ────────────────────────────
log "Step 1/8 — Loading environment variables..."
if [ ! -f "$APP_DIR/.env" ]; then
  error ".env file not found at $APP_DIR/.env — cannot deploy without it!"
fi
# Export all variables from .env so DATABASE_URL is available to pg_dump and prisma
set -a
# shellcheck disable=SC1091
source "$APP_DIR/.env"
set +a
success "Environment variables loaded."

# ─── Step 2: Pull latest code from GitHub ────────────────────────────────────
log "Step 2/8 — Pulling latest code from GitHub (main branch)..."
cd "$APP_DIR"
git fetch origin main
git reset --hard origin/main   # Hard reset ensures a clean, reproducible state
success "Code updated to latest commit: $(git log -1 --format='%h — %s')"

# ─── Step 3: Install Node.js dependencies ────────────────────────────────────
log "Step 3/8 — Installing Node.js dependencies..."
npm ci --omit=dev --prefer-offline
success "Dependencies installed."

# ─── Step 4: Generate Prisma Client ──────────────────────────────────────────
log "Step 4/8 — Generating Prisma Client..."
npx prisma generate
success "Prisma Client generated."

# ─── Step 5: Database backup (BEFORE migrations) ─────────────────────────────
log "Step 5/8 — Backing up PostgreSQL database..."
mkdir -p "$BACKUP_DIR"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/ibis_db_backup_${TIMESTAMP}.sql"

# pg_dump connects to the DATABASE_URL from .env
# The DATABASE_URL points to the separate Lightsail PostgreSQL instance
if pg_dump "$DATABASE_URL" > "$BACKUP_FILE" 2>/dev/null; then
  BACKUP_SIZE=$(du -sh "$BACKUP_FILE" | cut -f1)
  success "Database backup saved: $BACKUP_FILE ($BACKUP_SIZE)"
else
  # Backup failed — still continue (warn rather than abort for first deploy)
  # On a critical production system, change this to: error "Backup failed!"
  warn "Database backup failed — skipping. Check pg_dump and network access to the DB server."
  warn "Tip: Run 'sudo apt-get install postgresql-client' if pg_dump is not installed."
fi

# Keep only the last $KEEP_BACKUPS backups to conserve disk space
BACKUP_COUNT=$(ls "$BACKUP_DIR"/*.sql 2>/dev/null | wc -l)
if [ "$BACKUP_COUNT" -gt "$KEEP_BACKUPS" ]; then
  ls -t "$BACKUP_DIR"/*.sql | tail -n +"$((KEEP_BACKUPS + 1))" | xargs rm -f
  success "Old backups cleaned (kept last $KEEP_BACKUPS)."
fi

# ─── Step 6: Run Prisma Migrations ───────────────────────────────────────────
log "Step 6/8 — Running Prisma database migrations..."
log "  (If this fails, the server will NOT restart — your old version stays live)"

# prisma migrate deploy is SAFE for production:
#   - It only applies NEW pending migrations
#   - It never resets or drops data
#   - It fails fast if a migration has a conflict
npx prisma migrate deploy
success "Database migrations applied successfully."

# ─── Step 7: Build Next.js application ───────────────────────────────────────
log "Step 7/8 — Building Next.js application..."
npm run build
success "Next.js build complete."

# ─── Step 8: Restart application with pm2 ────────────────────────────────────
log "Step 8/8 — Restarting application with pm2..."

# 'pm2 restart' if the app is already running; 'pm2 start' on first deploy
if pm2 describe "$APP_NAME" > /dev/null 2>&1; then
  pm2 restart "$APP_NAME" --update-env
  success "Application restarted (pm2: $APP_NAME)."
else
  pm2 start npm --name "$APP_NAME" -- start
  pm2 save  # Save process list so it survives server reboots
  success "Application started for the first time (pm2: $APP_NAME)."
fi

# ─── Done ─────────────────────────────────────────────────────────────────────
echo ""
log "============================================================"
success "  IBIS RICE — Deploy Completed at $(date '+%Y-%m-%d %H:%M:%S')"
log "============================================================"
echo ""
log "Application is live at: http://13.251.56.200:3000"
log "Check logs anytime with: pm2 logs $APP_NAME"
log "Check status with:        pm2 status"
echo ""
