# IBIS RICE — Complete Server Setup Guide (Step 0 → Live)

Full deployment guide using your **existing** Amazon Lightsail infrastructure.

---

## 📌 Your Confirmed Infrastructure

| Resource | Details |
|----------|---------|
| **App Server** | Amazon Linux 2023 — 8 GB RAM / 160 GB SSD |
| **SSH User** | `ec2-user` |
| **App Directory** | `/home/ec2-user/ibis-app` |
| **PostgreSQL Server** | Lightsail Managed PostgreSQL 17.9 (existing) |
| **Existing App** | Survey Solutions running on Docker (port 80) |
| **Domain** | `icsserver.com` (managed via Cloudflare) |
| **New Subdomain** | `procument.icsserver.com` (IBIS RICE) |

---

## 🗺️ What Will Change

```
BEFORE                               AFTER
──────────────────────────────       ─────────────────────────────────────────
Port 80 → Survey Solutions Docker    Port 80/443 → Nginx (routes by domain)
                                         ├── icsserver.com          → Survey Solutions
                                         │                            (Docker, port 9000)
                                         └── procument.icsserver.com → IBIS RICE
                                                                      (Node.js, port 3000)

PostgreSQL                           PostgreSQL (same server, new database)
  └── SurveySolutions (existing)       ├── SurveySolutions (unchanged)
                                       └── ibis_db (new)
```

---

## ✅ Phase 1 — Cloudflare DNS (2 minutes, no downtime)

### Step 1.1 — Add Subdomain for IBIS RICE

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select your domain **`icsserver.com`**
3. Go to **DNS → Records → Add record**
4. Fill in:

| Field | Value |
|-------|-------|
| **Type** | `A` |
| **Name** | `procument` |
| **IPv4 address** | Your static IP (same IP as `icsserver.com`) |
| **Proxy status** | 🟠 Proxied (orange cloud ON) |
| **TTL** | Auto |

5. Click **Save**

> ✅ `procument.icsserver.com` now resolves to your server. Cloudflare handles SSL automatically — no certificate installation needed.

---

## ✅ Phase 2 — Server Preparation (5 minutes, no downtime)

SSH into your server from your Windows machine:

```powershell
# On your Windows PowerShell
ssh -i "C:\path\to\your-key.pem" ec2-user@YOUR_STATIC_IP
```

### Step 2.1 — Verify Node.js is installed

```bash
node --version    # should show v18.x or higher
npm --version
```

If Node.js is older than v18, upgrade:
```bash
# Install Node.js 18 via NodeSource
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo dnf install -y nodejs
```

### Step 2.2 — Install pm2 (process manager)

```bash
sudo npm install -g pm2
pm2 --version    # verify install
```

### Step 2.3 — Install PostgreSQL client tools (for database backups)

```bash
sudo dnf install -y postgresql15    # installs pg_dump client only, NOT a DB server
pg_dump --version                   # verify: pg_dump (PostgreSQL) 15.x
```

### Step 2.4 — Install Nginx

```bash
sudo dnf install -y nginx
# Do NOT start Nginx yet — port 80 is still used by Survey Solutions Docker
nginx -v    # verify install
```

### Step 2.5 — Install Git (usually pre-installed on Amazon Linux 2023)

```bash
git --version    # if not found:
sudo dnf install -y git
```

---

## ✅ Phase 3 — Nginx Configuration (5 minutes, no downtime)

### Step 3.1 — Create Nginx config file

```bash
sudo nano /etc/nginx/conf.d/ibis-apps.conf
```

Paste the following exactly:

```nginx
# ── Survey Solutions ─────────────────────────────────────────────────────────
server {
    listen 80;
    server_name icsserver.com www.icsserver.com;

    # Survey Solutions uploads large files
    client_max_body_size 500M;

    location / {
        proxy_pass http://localhost:9000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
        proxy_connect_timeout 60s;
    }
}

# ── IBIS RICE ────────────────────────────────────────────────────────────────
server {
    listen 80;
    server_name procument.icsserver.com;

    # Passbook photos + scale weight photos
    client_max_body_size 20M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 120s;
    }
}
```

Save: `Ctrl+O` → `Enter` → `Ctrl+X`

### Step 3.2 — Validate Nginx config

```bash
sudo nginx -t
```

Expected output:
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

> ⛔ If you see any error here, **stop and fix it before proceeding**. Do not touch Survey Solutions yet.

---

## ✅ Phase 4 — Survey Solutions Migration (~30 sec downtime)

> ⚠️ **Plan this during off-hours.** Survey Solutions will be unavailable for about 30 seconds.
> Your data is 100% safe — it's in a named Docker volume (`hq_data`) that is never deleted.

### Step 4.1 — Stop and remove old container

```bash
sudo docker stop hq
sudo docker rm hq
```

### Step 4.2 — Restart Survey Solutions on internal port 9000

Run this exact command (replace `YOUR_REAL_DB_PASSWORD` with your actual password):

```bash
sudo docker run -d -p 9000:80 --name hq \
    --restart unless-stopped \
    -e "HQ_Headquarters__TenantName=hq" \
    -e "HQ_Headquarters__BaseUrl=https://icsserver.com/" \
    -e "HQ_ConnectionStrings__DefaultConnection=Server=YOUR_POSTGRESQL_HOST;Port=5432;User Id=dbmasteruser;Password=YOUR_REAL_DB_PASSWORD;Database=SurveySolutions" \
    -e "ASPNETCORE_URLS=http://+:80" \
    -v "hq_data:/app/AppData" \
    surveysolutions/surveysolutions:latest
```

> Changes from your original command:
> - `-p 80:80` → `-p 9000:80` (moves to internal port)
> - Added `-d` (proper background mode)
> - Added `--restart unless-stopped` (auto-restart after server reboots)

### Step 4.3 — Start Nginx immediately (Survey Solutions comes back online)

```bash
sudo systemctl start nginx
sudo systemctl enable nginx    # auto-start Nginx on server reboot
```

### Step 4.4 — Verify Survey Solutions is back online

```bash
sudo docker ps                  # hq should show: 0.0.0.0:9000->80/tcp
curl -I http://localhost:9000   # should return HTTP 200 or 302
```

Open `https://icsserver.com` in your browser — Survey Solutions should load normally. ✅

---

## ✅ Phase 5 — Create IBIS RICE Database (3 minutes)

Connect to your PostgreSQL server and create the IBIS RICE database.

### Step 5.1 — Connect to PostgreSQL from the app server

```bash
# Connect using your existing credentials
psql "postgresql://dbmasteruser:YOUR_REAL_DB_PASSWORD@YOUR_POSTGRESQL_HOST:5432/postgres"
```

### Step 5.2 — Create the database and user

```sql
-- Create the IBIS RICE database
CREATE DATABASE ibis_db;

-- Create a dedicated user for IBIS RICE (optional but recommended)
CREATE USER ibis_user WITH ENCRYPTED PASSWORD 'choose-a-strong-password';
GRANT ALL PRIVILEGES ON DATABASE ibis_db TO ibis_user;

-- Exit psql
\q
```

> You can also use `dbmasteruser` directly instead of creating `ibis_user` — both work.

---

## ✅ Phase 6 — Deploy IBIS RICE App (10 minutes)

### Step 6.1 — Clone the repository

```bash
cd /home/ec2-user
git clone https://github.com/Laychansetha/digitalization_payment_dev.git ibis-app
cd ibis-app
```

### Step 6.2 — Create the production `.env` file

```bash
nano .env
```

Paste and fill in your real values:

```env
# ─── Database ────────────────────────────────────────────────────────────────
# Same PostgreSQL server as Survey Solutions, different database (ibis_db)
DATABASE_URL="postgresql://dbmasteruser:YOUR_REAL_DB_PASSWORD@YOUR_POSTGRESQL_HOST:5432/ibis_db?schema=public"

# ─── NextAuth ────────────────────────────────────────────────────────────────
# Generate a secret by running in a separate terminal:
#   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
NEXTAUTH_SECRET="paste-your-generated-64-char-secret-here"
NEXTAUTH_URL="https://procument.icsserver.com"

# ─── Server ──────────────────────────────────────────────────────────────────
PORT=3000
HOSTNAME="0.0.0.0"
```

Save: `Ctrl+O` → `Enter` → `Ctrl+X`

**Generate NEXTAUTH_SECRET** (open a second terminal, SSH in again):
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Copy the output and paste it as `NEXTAUTH_SECRET` in the `.env` file.

### Step 6.3 — Install dependencies

```bash
npm ci
```

### Step 6.4 — Generate Prisma client

```bash
npx prisma generate
```

### Step 6.5 — Run database migrations (creates all tables)

```bash
npx prisma migrate deploy
```

### Step 6.6 — Seed master data and default accounts

```bash
npm run seed
```

This creates default users, paddy varieties, provinces, villages, and bank data.

### Step 6.7 — Build the application

```bash
npm run build
```

This takes 2–3 minutes. Expected to end with:
```
✓ Compiled successfully
```

### Step 6.8 — Start with pm2

```bash
pm2 start npm --name ibis-app -- start
```

### Step 6.9 — Save pm2 process list (survive server reboots)

```bash
pm2 save

# Configure pm2 to start on boot — run the command this prints:
pm2 startup
# Example output: sudo env PATH=... pm2 startup systemd -u ec2-user --hp /home/ec2-user
# Copy and run that exact command
```

### Step 6.10 — Verify IBIS RICE is running

```bash
pm2 status                        # ibis-app should show: online
curl -I http://localhost:3000     # should return HTTP 200 or 302
```

Open `https://procument.icsserver.com` in your browser — IBIS RICE login page should appear. ✅

Login with: `admin@ibisrice.org` / `Ibis2026!`

---

## ✅ Phase 7 — GitHub Secrets Setup (CI/CD Automation)

After this phase, every `git push` to `main` will automatically deploy to your server.

### Step 7.1 — Generate an SSH key pair for GitHub Actions

Run on your **Windows machine** (PowerShell):

```powershell
# Press Enter when asked for passphrase — leave it empty
ssh-keygen -t rsa -b 4096 -C "github-actions-ibis-deploy" -f "$env:USERPROFILE\.ssh\ibis_deploy_key"
```

Creates two files:
- `ibis_deploy_key` → **Private key** → goes to GitHub
- `ibis_deploy_key.pub` → **Public key** → goes to the server

### Step 7.2 — Add public key to the server

View the public key:
```powershell
Get-Content "$env:USERPROFILE\.ssh\ibis_deploy_key.pub"
```

Copy the entire output. Then on your **server**:
```bash
echo "PASTE_PUBLIC_KEY_HERE" >> /home/ec2-user/.ssh/authorized_keys
chmod 600 /home/ec2-user/.ssh/authorized_keys
```

Test it:
```powershell
ssh -i "$env:USERPROFILE\.ssh\ibis_deploy_key" ec2-user@YOUR_STATIC_IP
# Should connect without asking for a password
```

### Step 7.3 — Add secrets to GitHub

1. Go to `https://github.com/Laychansetha/digitalization_payment_dev`
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** and add these 4 secrets:

---

**Secret 1: `VPS_SSH_PRIVATE_KEY`**

Get the value:
```powershell
Get-Content "$env:USERPROFILE\.ssh\ibis_deploy_key"
```
Copy the **entire output** including `-----BEGIN RSA PRIVATE KEY-----` lines.

---

**Secret 2: `VPS_HOST`**
```
Value: YOUR_STATIC_IP
```

---

**Secret 3: `VPS_USER`**
```
Value: ec2-user
```

---

**Secret 4: `VPS_APP_DIR`**
```
Value: /home/ec2-user/ibis-app
```

---

Your secrets page should now show:
```
VPS_APP_DIR          ✓
VPS_HOST             ✓
VPS_SSH_PRIVATE_KEY  ✓
VPS_USER             ✓
```

---

## ✅ Phase 8 — Test the Full Pipeline

### Step 8.1 — Make a small test commit from your Windows machine

```powershell
# On your Windows machine in the project folder
git add .
git commit -m "ci: test first automated deployment"
git push origin main
```

### Step 8.2 — Watch GitHub Actions

1. Go to `https://github.com/Laychansetha/digitalization_payment_dev/actions`
2. You should see a new workflow run appear
3. Wait for all jobs to complete:

```
✅ Code Quality & Build Check   (~3-4 minutes)
   ├── TypeScript type-check
   ├── ESLint
   └── Next.js build

✅ Deploy to Production VPS     (~2-3 minutes)
   ├── SSH into ec2-user@YOUR_IP
   └── Run deploy.sh
```

### Step 8.3 — Verify on the server after pipeline runs

```bash
pm2 status                    # ibis-app: online
pm2 logs ibis-app --lines 20  # should show Next.js started on port 3000
ls /home/ec2-user/ibis-app/backups/   # database backup file should exist
```

---

## ✅ Phase 9 — Final Verification Checklist

```
Infrastructure
  ☐ icsserver.com loads Survey Solutions (no change)
  ☐ procument.icsserver.com loads IBIS RICE login page
  ☐ docker ps shows hq on 0.0.0.0:9000->80 (not port 80 directly)
  ☐ sudo systemctl status nginx shows: active (running)

IBIS RICE App
  ☐ Login with admin@ibisrice.org / Ibis2026!
  ☐ Admin panel loads at /admin/config
  ☐ Can create a test village/variety entry
  ☐ pm2 status shows ibis-app: online

CI/CD Pipeline
  ☐ GitHub Actions shows green checkmarks for both jobs
  ☐ Push a second commit → pipeline runs and deploys automatically
  ☐ Backup file exists in /home/ec2-user/ibis-app/backups/

Resilience
  ☐ Reboot the server: sudo reboot
  ☐ After 2 minutes, both sites should auto-recover (pm2 + docker --restart)
```

---

## 📱 How to Build Flutter APK (When Needed)

The Android field app APK is NOT built on every push (takes 5–8 min). Build it when you have a new release:

```powershell
# Option A — Create a tagged release (creates a GitHub Release with APK attached)
git tag v1.0.0
git push origin v1.0.0

# Option B — Manual trigger
# Go to: GitHub → Actions → "Flutter APK Release" → "Run workflow"
```

Download the APK from:
`https://github.com/Laychansetha/digitalization_payment_dev/releases`

---

## 🔁 Day-to-Day Development Workflow

```powershell
# Make code changes on your Windows machine
# Then:

git add .
git commit -m "feat: describe what changed"
git push origin main

# GitHub Actions automatically:
# 1. Checks code quality
# 2. Builds the app
# 3. Deploys to procument.icsserver.com
# Total time: ~6-7 minutes
```

---

## 💾 Database Backup & Rollback

### Automated backups
Every deploy creates a backup at `/home/ec2-user/ibis-app/backups/`. Last 7 backups are kept.

### Manual backup
```bash
source /home/ec2-user/ibis-app/.env
pg_dump "$DATABASE_URL" > ~/manual-backup-$(date +%Y%m%d_%H%M%S).sql
```

### Rollback after a bad deploy
```bash
pm2 stop ibis-app
source /home/ec2-user/ibis-app/.env
psql "$DATABASE_URL" < /home/ec2-user/ibis-app/backups/ibis_db_backup_YYYYMMDD_HHMMSS.sql
cd /home/ec2-user/ibis-app
git log --oneline -10
git reset --hard PREVIOUS_COMMIT_HASH
npm run build
pm2 start ibis-app
```

---

## ❓ Troubleshooting

### Survey Solutions not loading after migration
```bash
sudo docker logs hq --tail 50    # check container logs
curl -I http://localhost:9000    # test internal connection
sudo systemctl status nginx      # check Nginx status
```

### IBIS RICE shows connection error
```bash
pm2 logs ibis-app --lines 30    # look for database connection errors
cat /home/ec2-user/ibis-app/.env  # verify DATABASE_URL is correct
```

### GitHub Actions deploy fails with "Permission denied"
```bash
# On the server — check authorized_keys
cat /home/ec2-user/.ssh/authorized_keys   # should show the deploy key
chmod 700 /home/ec2-user/.ssh
chmod 600 /home/ec2-user/.ssh/authorized_keys
```

### After server reboot, app is down
```bash
pm2 status    # if ibis-app not listed, pm2 save was not run
pm2 resurrect # restore saved process list
```

