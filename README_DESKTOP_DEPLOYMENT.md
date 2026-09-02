# IBIS Rice Procurement & Payment System — Desktop Deployment Guide

Complete step-by-step guide to deploy the **IBIS Rice Procurement & Payment System** on a Windows Desktop PC with **local PostgreSQL** and **Cloudflare Tunnel** (`payment.icsserver.com`).

---

## 📋 System Prerequisites

Before starting, install the following on the Windows Desktop PC:

1. **Node.js (v20 or v24 LTS)**:
   - Download & install from [nodejs.org](https://nodejs.org).
   - Verify installation in Command Prompt: `node -v`

2. **PostgreSQL (v14, v15, or v16)**:
   - Download & install from [postgresql.org/download/windows](https://www.postgresql.org/download/windows/).
   - Set superuser password during installation (e.g. `PostgreSQL-Dev-Field-2026` or your own chosen password).
   - Ensure the PostgreSQL Windows Service is running on port `5432`.

3. **Cloudflare Tunnel CLI (`cloudflared`)**:
   - Download `cloudflared-windows-amd64.exe` from Cloudflare GitHub releases.
   - Install as a Windows service or run from command line.

---

## 🚀 Quick Setup Instructions (3 Simple Steps)

### Step 1: Extract & Configure `.env`

1. Copy the deployment package folder `digitalization_payment_dev` to your target desktop (e.g. `C:\IBIS_Payment_Server`).
2. Open the folder and locate `.env.example`.
3. If `.env` doesn't exist, `setup_windows.bat` will copy `.env.example` to `.env` automatically.
4. Edit `.env` to update your PostgreSQL password if it differs from default:
   ```env
   DATABASE_URL="postgresql://postgres:YOUR_POSTGRES_PASSWORD@localhost:5432/ibis_db?schema=public"
   NEXTAUTH_URL="https://payment.icsserver.com"
   NEXTAUTH_SECRET="ibis-rice-secret-key-2026-production-super-secure"
   PORT=3000
   HOSTNAME="0.0.0.0"
   ```

---

### Step 2: Run One-Click Automated Setup

Double-click **`setup_windows.bat`**.

This automated batch script will perform:
1. Node.js check.
2. `.env` file verification.
3. Node dependencies check (`node_modules`).
4. Prisma ORM Client generation (`prisma generate`).
5. **Database verification & auto-creation** of database `ibis_db` if it doesn't exist.
6. Database schema sync (`prisma db push`).
7. **Master Data & Default Account Seeding** (`npm run seed`).
8. Production Next.js build (`npm run build`).

---

### Step 3: Configure Cloudflare Tunnel & Launch Server

#### 1. Route DNS & Configure Cloudflare Tunnel:
Open Command Prompt (`cmd.exe`) as Administrator and add the tunnel DNS route:
```cmd
cloudflared tunnel route dns YOUR_TUNNEL_NAME payment.icsserver.com
```

In your Cloudflare Tunnel config file (`C:\Users\<YourUsername>\.cloudflared\config.yml`), ensure the ingress rule points port 3000:
```yaml
ingress:
  - hostname: payment.icsserver.com
    service: http://localhost:3000
  - service: http_status:404
```

#### 2. Start the Production Server:
Double-click **`start_server.bat`**.

The server will launch on `http://localhost:3000` (and `http://0.0.0.0:3000`), accessible online at:
👉 **`https://payment.icsserver.com`**

---

## 🔐 Master Login Accounts (By Role)

Once the server is running, users can access `https://payment.icsserver.com` and log in with any of the following accounts:

| Role | Username / Email | Password | Assigned Scope / Access |
|---|---|---|---|
| 👑 **ADMIN** | `chansetha` *(or `admin@ibisrice.com`)* | `Setha*2026` | Full System Access & Master Settings |
| 🌾 **FIELD** | `piseth` *(or `field@ibisrice.com`)* | `PVH-piseth-2026` | Specs Record, Farmer Registration, Purchase, Transport |
| 🏬 **WAREHOUSE** | `phearun` *(or `warehouse@ibisrice.com`)* | `KPT-phearun-2026` | Weighbridge Intake & Quality Verification |
| 📦 **INVENTORY** | `bousong` *(or `inventory@ibisrice.com`)* | `PNH-bousong-2026` | Silo / Stack Storage & Inventory Management |
| 💳 **FINANCE** | `chanvoleak` *(or `finance@ibisrice.com`)* | `PP-voleak-2026` | Bank Document Reconciliation & Disbursement |

---

## 🛠️ Utility & Maintenance Scripts

- **`start_server.bat`**: One-click production server launcher.
- **`start_dev_server.bat`**: One-click development server launcher.
- **`clean_db.bat`**: Cleanly resets test transaction data while preserving all master configuration.
- **`backup_db.bat`**: Creates timestamped JSON backups of database tables in `backups/`.

---

## ❓ Troubleshooting & FAQs

### Q: Server error `Could not connect to PostgreSQL database on port 5432`
* **Fix**: Ensure PostgreSQL service is running in Windows Services (`services.msc` -> PostgreSQL). Verify PostgreSQL password in `.env` matches your installed password.

### Q: Login loops back to login page when accessing online
* **Fix**: Ensure `NEXTAUTH_URL="https://payment.icsserver.com"` is set in `.env` and restart `start_server.bat`.

### Q: `prisma` or `tsx` not recognized error in command prompt
* **Fix**: Run `setup_windows.bat` which automatically uses local `node_modules\.bin` binaries.
