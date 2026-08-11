# IBIS RICE — Integrated Field Operations, Warehouse Intake & Finance Portal

Official enterprise application suite built for **IBIS RICE CONSERVATION CO., LTD**.

---

## 🏗️ System Architecture Overview

```
┌────────────────────────────────────────────────────────────────────────┐
│                   IBIS RICE CENTRAL WEB APPLICATION                    │
│                 (Next.js + PostgreSQL + Prisma ORM)                    │
└────────────────────────────────────────────────────────────────────────┘
                                    │
           ┌────────────────────────┴────────────────────────┐
           ▼                                                 ▼
┌──────────────────────────────┐          ┌──────────────────────────────┐
│  ANDROID TABLET FIELD APP    │          │  CENTRAL WEB ADMIN & INTAKE  │
│  (Flutter Native + SQLite)   │          │        (Online-Only)         │
├──────────────────────────────┤          ├──────────────────────────────┤
│ • Quality Specs Inspection   │          │ • Warehouse Scale Intake     │
│ • Farmer Profile & Passbook  │          │ • Scale Tolerance Audit      │
│ • Paddy Purchase Receipts    │          │ • Finance Bank Disbursement  │
│ • Transport Dispatch         │          │ • Admin & User Mgmt          │
│ • Offline Auto-Sync Engine   │          │ • Master Varieties & Prices  │
└──────────────────────────────┘          └──────────────────────────────┘
```

1. **Central Web Application & REST API Server** (Next.js + PostgreSQL):
   - Central administration portal, warehouse scale receiving terminal, finance payment reconciliation hub, and master configuration center.
2. **Android Field Application** (Flutter Native + SQLite):
   - Runs on physical Android tablets used by field inspectors in remote villages across 4 provinces (**Preah Vihear**, **Stung Treng**, **Ratanakiri**, **Mondulkiri**).
   - Operates 100% offline. Automatically synchronises with the central server when connected to Wi-Fi.

---

## 📁 Repository Structure

```text
digitalization_payment_dev/
├── field_app/                    # Flutter Android Native Application
│   ├── lib/                      # Dart source (views, models, database, services)
│   ├── android/                  # Android native project configuration
│   ├── assets/                   # App assets (images, fonts)
│   └── pubspec.yaml              # Flutter dependency manifest
├── prisma/                       # Prisma ORM — Database Schema & Seed
│   ├── schema.prisma             # Active PostgreSQL database schema
│   ├── schema.postgresql.prisma  # PostgreSQL schema template
│   └── seed.ts                   # Master config & default user account seed
├── public/                       # Static web assets & uploaded media
│   └── uploads/                  # Uploaded bank passbooks & scale photos
├── scripts/                      # Developer utility scripts
│   ├── check-counts.ts           # DB row count report
│   ├── check_province_villages.ts# Province/village audit
│   └── clean-database.ts         # Development DB cleanup
├── src/                          # Next.js Web Application & REST APIs
│   ├── app/                      # App Router — pages & API route handlers
│   ├── components/               # UI modals, selectors & print reports
│   └── lib/                      # DB client, auth helpers
├── .env.example                  # ← Environment variable template (copy to .env)
├── .gitignore                    # Git exclusion rules
├── DEPLOYMENT_GUIDE.md           # Full production deployment guide
├── README.md                     # This file
├── package.json                  # Web app Node.js dependencies
├── next.config.ts                # Next.js configuration
├── tsconfig.json                 # TypeScript configuration
├── reset-fresh-postgresql.bat    # 1-click clean DB reset & seed
├── switch-to-postgresql.bat      # 1-click DB setup for a fresh install
├── start-production-local.bat    # 1-click local production server
├── build-android-apk.bat         # 1-click Android APK build
└── create-app-icons.ps1          # Android app icon generator
```

---

## 🚀 Developer Setup Guide (Windows)

Follow these steps to clone and run the project on a new Windows computer.

### Prerequisites

Install the following before proceeding:

| Tool | Version | Download |
|------|---------|----------|
| **Git** | Latest | https://git-scm.com/download/win |
| **Node.js** | v18 or higher | https://nodejs.org |
| **PostgreSQL** | v14 or higher | https://www.postgresql.org/download/windows/ |
| **Flutter SDK** | ≥ 3.0.0 | https://flutter.dev (only needed to modify/build mobile app) |
| **JDK 17** | 17.x | https://adoptium.net (only needed to build the Android APK) |

---

### 1. Clone the Repository

```cmd
git clone https://github.com/Laychansetha/digitalization_payment_dev.git
cd digitalization_payment_dev
```

---

### 2. Install Node.js Dependencies

```cmd
npm install
```

---

### 3. Configure Environment Variables

Copy the template to create your local `.env` file:

```cmd
copy .env.example .env
```

Then open `.env` in a text editor and fill in your values:

```env
# Your PostgreSQL connection — update password and database name as needed
DATABASE_URL="postgresql://postgres:<YOUR_DB_PASSWORD>@localhost:5432/ibis_db?schema=public"

# Generate a secure random secret:
#   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
NEXTAUTH_SECRET="<your-generated-secret>"
NEXTAUTH_URL="http://localhost:3000"

PORT=3000
HOSTNAME="0.0.0.0"
```

> ⚠️ **Never commit `.env` to Git.** It is already in `.gitignore`.

---

### 4. Set Up PostgreSQL

1. Open **pgAdmin** or **psql** and create a database:
   ```sql
   CREATE DATABASE ibis_db;
   ```
2. Make sure your `DATABASE_URL` in `.env` matches the database name, user, and password.

---

### 5. Run Prisma Migrations & Seed

Run the included 1-click script:

```cmd
switch-to-postgresql.bat
```

This will:
- Generate the Prisma client
- Push the schema to your PostgreSQL database
- Seed all master data and default user accounts

**Or run the commands manually:**

```cmd
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts
```

---

### 6. Start the Web Application

#### Development mode (with hot reload):

```cmd
npm run dev
```

#### Production mode:

```cmd
start-production-local.bat
```

Or manually:

```cmd
npm run build
npm run start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

### 7. Default Login Accounts

Password for all pre-configured accounts: **`Ibis2026!`**

| Role | Email |
|------|-------|
| System Admin | `admin@ibisrice.org` |
| Warehouse Operator | `warehouse@ibisrice.org` |
| Finance Officer | `finance@ibisrice.org` |
| Field Inspector | `field@ibisrice.org` (and `field1` → `field24`) |

---

### 8. Build or Run the Flutter Mobile App

> **Prerequisites**: Flutter SDK ≥ 3.0.0 and JDK 17 must both be on your system PATH.

#### Run in development (connected Android device or emulator):

```cmd
cd field_app
flutter pub get
flutter run
```

> Before running, set `baseUrl` in `field_app/lib/services/api_service.dart` to your server's LAN IP address, e.g. `http://192.168.1.10:3000`.

#### Build a release APK:

```cmd
build-android-apk.bat
```

The APK will be placed at the project root as `field_app.apk`.

> **Note**: `field_app.apk` is excluded from version control (it's a build artifact). Build it fresh from source on each machine.

---

### 9. Reset the Database (Development Only)

To completely wipe and re-seed the database:

```cmd
reset-fresh-postgresql.bat
```

---

## 🔄 Git Workflow — Continuing Development

### Push changes to GitHub

```cmd
git add .
git commit -m "feat: describe what you changed"
git push origin main
```

### Pull latest changes on another computer

```cmd
git pull origin main
npm install          # in case dependencies changed
npx prisma generate  # in case schema changed
```

### Common workflow after pulling:

```cmd
git pull origin main
npm install
npx prisma generate
npx prisma db push
npm run dev
```

---

## 🔐 Security Notes

- `.env` is **always** excluded from Git (see `.gitignore`)
- Never commit database passwords, API keys, or secrets
- The `NEXTAUTH_SECRET` should be a unique, randomly generated string per environment
- Default accounts (`Ibis2026!`) are for development/demo only — change passwords in production

---

## 📖 Additional Documentation

- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) — Full production server deployment guide
- [PROJECT_MEMORY.md](./PROJECT_MEMORY.md) — Architecture decisions and development history
