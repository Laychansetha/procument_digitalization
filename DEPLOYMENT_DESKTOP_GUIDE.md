# IBIS Rice Procurement & Payment System — Single-Desktop Deployment Guide

This guide explains how to run **IBIS Rice Procurement System** alongside your existing **GoO Document Management** app on the **same Windows desktop machine**, and share 1 **Cloudflare Tunnel**.

---

## 1. Local Port Map (No Conflicts)

| System Name | Tech Stack | Local Port | Subdomain |
|---|---|---|---|
| 📄 **GoO Document Manager** | Python / FastAPI / SQLite | `8000` | `https://goo.icsserver.com` |
| 🌾 **IBIS Procurement & Payment** | Next.js 16 / PostgreSQL | `3000` | `https://payment.icsserver.com` |
| 🗄️ **PostgreSQL Database** | PostgreSQL Service | `5432` | *(Internal Database Service)* |

---

## 2. Cloudflare Tunnel Configuration (`config.yml`)

Location: `C:\Users\<YourUsername>\.cloudflared\config.yml`

```yaml
tunnel: YOUR_TUNNEL_UUID
credentials-file: C:\Users\<YourUsername>\.cloudflared\YOUR_TUNNEL_UUID.json

ingress:
  # App 1: GoO Document Manager
  - hostname: goo.icsserver.com
    service: http://localhost:8000

  # App 2: IBIS Procurement & Payment System
  - hostname: payment.icsserver.com
    service: http://localhost:3000

  # Fallback catch-all rule
  - service: http_status:404
```

### Steps for Locally Configured Tunnel (`goo-server`):

Because your `goo-server` tunnel is configured locally on your desktop, you manage its routes by updating your desktop's `config.yml` file and registering the DNS entry:

1. **Edit `config.yml` on your desktop**:
   Open `C:\Users\<YourUsername>\.cloudflared\config.yml` and add the `payment` ingress rule:
   ```yaml
   ingress:
     - hostname: goo.icsserver.com
       service: http://localhost:8000
     - hostname: payment.icsserver.com
       service: http://localhost:3000
     - service: http_status:404
   ```

2. **Register the DNS route in Command Prompt**:
   Open Command Prompt (`cmd.exe`) on your desktop and run:
   ```cmd
   cloudflared tunnel route dns goo-server payment.icsserver.com
   ```

3. **Restart the Cloudflare Service**:
   ```cmd
   =========================================================
  IBIS Rice Procurement and Payment System - Desktop Setup
=========================================================

[1/6] Checking Node.js installation...
v24.18.0

[2/6] Verifying Environment Configuration (.env)...

[3/6] Checking Node packages (node_modules)...

[4/6] Generating Prisma ORM Client...
npm notice run ibis-app@0.1.0 npx
npm notice run prisma generate
'prisma' is not recognized as an internal or external command,
operable program or batch file.
ERROR: Prisma client generation failed!
Press any key to continue . . .
   ```


---

## 3. Desktop One-Click Launcher Scripts

The following `.bat` scripts are in this directory:

- **`setup_windows.bat`**: Run once to initialize Prisma ORM client and seed master data into PostgreSQL.
- **`start_server.bat`**: One-click launcher to run the production build on `http://localhost:3000`.
- **`start_dev_server.bat`**: One-click launcher to run dev server on `http://localhost:3000`.
- **`clean_db.bat`**: Resets test transaction data cleanly while preserving master settings.
- **`backup_db.bat`**: Creates a timestamped database backup JSON file in `backups/`.

---

## 4. Mobile Field App & Remote Syncing

### Will `field_app` still work and sync?
**YES, 100%!**

1. **Remote Sync via Cloudflare Tunnel**:
   - Point your `field_app` API base URL to `https://payment.icsserver.com/api`.
   - Field teams in **Preah Vihear**, **Stung Treng**, **Ratanakiri**, and **Mondulkiri** can sync specs, farmer payment profiles, purchase records, and truck dispatches over 4G/LTE directly to your Desktop server!

2. **Offline-First Safeguard**:
   - Field staff can record quality specs and sack weights offline in remote villages without internet.
   - When they get back into coverage, clicking **Sync** sends all records directly to your Desktop's PostgreSQL database (`ibis_db`).

3. **Admin Master Settings & RBAC**:
   - Master data (Villages, Bank registry, Paddy price specs, User roles) are stored in PostgreSQL on your desktop (`ibis_db`).
   - Any updates made in `/admin/config` immediately sync down to field apps when they refresh or sync.
