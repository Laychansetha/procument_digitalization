# IBIS RICE — Integrated Field Operations, Warehouse Intake & Finance Portal

Official enterprise application suite built for **IBIS RICE CONSERVATION CO., LTD**.

---

## 🏗️ System Architecture Overview

The system consists of two tightly integrated components:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   IBIS RICE CENTRAL WEB APPLICATION                    │
│                 (Next.js 16 + PostgreSQL + Prisma ORM)                 │
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

1. **Central Web Application & REST API Server** (Next.js 16 + PostgreSQL):
   - Serves as the central administration portal, warehouse scale receiving terminal, finance payment reconciliation hub, and master configuration center.
2. **Android Field Application** (Flutter Native + SQLite):
   - Runs on physical Android tablets used by field inspectors in remote villages across 4 provinces (**Preah Vihear**, **Stung Treng**, **Ratanakiri**, **Mondulkiri**).
   - Operates 100% offline without internet. Automatically synchronizes with the central server when connected to Wi-Fi.

---

## 📁 Clean Repository Structure

```text
digitalization_payment_dev/
├── field_app/                    # Flutter Android Native Application
│   ├── lib/                      # Flutter Dart source code (views, models, database, services)
│   ├── android/                  # Android native project configuration
│   └── pubspec.yaml              # Flutter dependencies manifest
├── prisma/                       # Prisma ORM Database Schemas & Seed Data
│   ├── schema.prisma             # Primary active database schema
│   ├── schema.postgresql.prisma  # PostgreSQL schema template
│   └── seed.ts                   # Master configuration & user account seed script
├── public/                       # Static web assets & media uploads
│   └── uploads/                  # Uploaded bank passbooks & scale photos
├── src/                          # Next.js Web Application & REST APIs
│   ├── app/                      # Next.js 16 App Router pages & API handlers
│   ├── components/               # UI Modals, search selectors & print reports
│   └── lib/                      # Database client, auth & server helpers
├── .env.example                  # Environment variable configuration template
├── DEPLOYMENT_GUIDE.md           # Step-by-step end-to-end deployment guide
├── field_app.apk                 # Single Release APK for Android Tablets (22.4 MB)
├── reset-fresh-postgresql.bat    # 1-Click clean database reset & seed script
├── switch-to-postgresql.bat      # 1-Click PostgreSQL table creation & seed script
├── start-production-local.bat    # 1-Click local production web server launcher
├── build-android-apk.bat         # 1-Click Android Release APK build script
├── create-zip-package.bat        # 1-Click deployment ZIP package creator
└── package.json                  # Web application dependencies & scripts
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **PostgreSQL**: v14.0 or higher
- **Flutter SDK**: (Optional, only needed if modifying mobile app source code)

### 1. Database Setup & Seed
1. Edit `.env` to configure your local PostgreSQL database connection string:
   ```env
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/ibis_db?schema=public"
   ```
2. Run the 1-Click clean reset script:
   ```cmd
   reset-fresh-postgresql.bat
   ```

### 2. Launch Local Web Application
Double-click **`start-production-local.bat`** (or run `npm run build && npm run start`).  
Open [http://localhost:3000](http://localhost:3000) in your web browser.

### 3. Install Mobile Application on Android Tablet
Locate **`field_app.apk`** in the project folder and copy it to your Android tablet to install.

---

## 🔐 Default Pre-Configured Accounts

Password for all pre-configured accounts: **`Ibis2026!`**

- **System Admin**: `admin@ibisrice.org`
- **Field Inspector**: `field@ibisrice.org` (and `field1@ibisrice.org` to `field24@ibisrice.org`)
- **Warehouse Operator**: `warehouse@ibisrice.org`
- **Finance Officer**: `finance@ibisrice.org`
