# IBIS Rice Digitalization & Payment System — PROJECT MEMORY & DEVELOPER GUIDE

> **Last Updated**: August 5, 2026  
> **Status**: Production Ready & Reset to Fresh State  
> **Repository Root**: `c:\Users\laych\Documents\digitalization_payment_dev`  
> **Local Server URL**: `http://localhost:3000` (or `http://0.0.0.0:3000`)

---

## 1. Executive Overview & System Architecture

The **IBIS Rice Digitalization & Payment System** is an enterprise-grade digital procurement, supply chain tracking, quality specification inspection, and farmer disbursement platform designed for IBIS Rice operations across Cambodia (Preah Vihear, Stung Treng, Ratanakiri, and Mondulkiri).

### Key Architecture Components:
- **Web Portal (`ibis-app`)**: Next.js 16 (App Router + Turbopack), React 19, TypeScript, TailwindCSS, Lucide Icons, NextAuth.js (Credentials Provider with BCrypt).
- **Mobile Field App (`field_app`)**: Standalone cross-platform React Native / Capacitor mobile application buildable as an Android APK (`field_app.apk`).
- **Database Layer**: PostgreSQL (`ibis_db` on port 5432) accessed via Prisma ORM v6.
- **Image Storage & Uploads**: Local static asset server serving `/uploads/*` directory directly mapped from `public/uploads/`.
- **Authentication & RBAC**: NextAuth.js session management with 5 strict role-based access levels.

```
       [ Mobile Field App (Capacitor/Android) ] 
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│              Next.js 16 App Router Server                │
│    (NextAuth RBAC, REST API Endpoints, Upload Engine)   │
└───────────────────────────┬─────────────────────────────┘
                            │
                            ▼
           ┌────────────────────────────────┐
           │   PostgreSQL Database (ibis_db) │
           │   via Prisma ORM (Port 5432)   │
           └────────────────────────────────┘
```

---

## 2. End-to-End Status Workflow

### System Architecture & Operational Scope:

```
                  ┌────────────────────────────────────────────────────────┐
                  │               MOBILE FIELD APP (Offline-First)          │
                  │   1. Specs Record      2. Farmer Payment Profile       │
                  │   3. Weighing & Purchase 4. Transport Dispatch          │
                  └───────────────────────────┬────────────────────────────┘
                                              │ Sync (Online)
                                              ▼
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                              NEXT.JS 16 WEB PORTAL (Online-Only)                       │
 │  [Stage 1: Field]  ──►  [Stage 2: Warehouse]  ──►  [Stage 3: Inventory] ──► [Stage 4: Finance]│
 └────────────────────────────────────────────┬───────────────────────────────────────────┘
                                              │
                                              ▼
                             ┌────────────────────────────────┐
                             │   PostgreSQL Database (ibis_db) │
                             │   via Prisma ORM (Port 5432)   │
                             └────────────────────────────────┘
```

#### Module Scope Classification:
- **Mobile Field App (Offline-First)**:
  - 1️⃣ **Specs Record**: Quality inspection data (moisture %, foreign matter %, whole grain %, broken rice %).
  - 2️⃣ **Farmer Payment Profile**: Farmer family codes, phone, bank name, account number, passbook photos.
  - 3️⃣ **Weighing & Purchase Record**: Individual sack weights, total weight, price specs, farmer/staff signatures.
  - 4️⃣ **Transport Dispatch**: Truck loading, driver details, destination warehouse selection.
- **Web Portal (Online-Only)**:
  - 🏬 **Warehouse Receiving**: Weighbridge gross/tare scale intake, photos, invoice verification.
  - 📦 **Inventory Stack/Silo Recording**: Paddy storage location confirmation (`Silo 01`, `Stack A`).
  - 💳 **Finance Verification & Disbursement**: Bank document reconciliation, disbursement authorization.
  - ⚙️ **Admin Master Settings**: System configurations, village/bank registry, user management.

---

## 2. End-to-End Workflow & Business Rules

### A. Flexible Uncoupled Field Workflow
- **Uncoupled Execution**: Field operations can be executed non-linearly or across multiple days depending on field conditions.
- **Asynchronous Synchronization**:
  - Staff can collect and sync **Specs Records** only.
  - Staff can collect and sync **Farmer Payment Profiles** only.
  - Staff can collect and sync **Purchase Records** only.
  - Truck loading can be performed on the mobile app or later via the web interface.
  - Syncing Specs or Profiles does not force immediate creation of Purchase Records or Transport Dispatches.

### B. Record Editing & Locking Rules Matrix

| Entity | State / Condition | Editable Status | Locking Rule |
|---|---|---|---|
| 🔬 **Specs Record** | Not linked to any Purchase Record | 🟢 **Editable** | Locked once linked to a `PurchaseRecord` (`specsRecord.purchaseRecord !== null`). |
| 📋 **Farmer Profile** | Any | 🟢 **Editable** | Profiles can be updated to correct bank details or phone numbers. |
| 🧾 **Purchase Record** | Unassigned (`transportRecordId === null`) | 🟢 **Editable** | Locked once assigned to a `TransportRecord` (`transportRecordId !== null`). |
| 🚛 **Transport Record** | `EN_ROUTE` or `REJECTED` | 🟢 **Editable** | Locked once received by Warehouse (`RECEIVED`, `VERIFIED`, `DISBURSED`) unless rejected back to Field by Warehouse. |
| 🏬 **Warehouse Intake** | `RECEIVED` or `REJECTED` | 🟢 **Editable** | Locked once verified or disbursed by Finance (`VERIFIED`, `DISBURSED`). |

### C. Approval Sequence & Rejection Chain

```
[Field Team] <--- (Reject to Field) --- [Warehouse] <--- (Reject to Warehouse) --- [Inventory] <--- (Reject to Inventory) --- [Finance]
```

- **Approval Sequence**: `Transport (Field) → Warehouse → Inventory → Finance`
- **Single-Stage Rejection Rules**:
  - **Finance → Inventory**: Finance rejects strictly to `INVENTORY`. `WarehouseIntake.inventoryStatus` becomes `REJECTED`. Record returns to Inventory queue with `🔴 Returned by Finance`.
  - **Inventory Delegation**: Inventory reviews Finance comments. If Inventory can resolve (e.g. storage notes/stack), Inventory updates and resubmits to Finance. If issue belongs to Warehouse, Inventory rejects to Warehouse (`targetModule = 'WAREHOUSE'`).
  - **Warehouse Delegation**: Warehouse reviews Inventory comments. If Warehouse can resolve (e.g. gross/tare weights or scale photos), Warehouse updates and resubmits to Inventory (`PUT /api/warehouse/intake/[id]`). If issue belongs to Field, Warehouse rejects to Field (`targetModule = 'FIELD'`).
  - **Field Resubmission**: Field updates transport manifest and resubmits (`PUT /api/transport/[id]`), resetting status to `EN_ROUTE` and restarting the approval chain `Field → Warehouse → Inventory → Finance`.

---

## 3. Database Schema & Data Models

Managed via `prisma/schema.prisma`:

### Core Models:
- **`User`**: System accounts (`email`, `password` hashed with bcrypt, `role`, `assignedProvinces`).
- **`Village`**: Target villages (`name`, `district`, `province`, `status`).
- **`Bank`**: Commercial banks (`name`, `code`, `status`).
- **`LocationRegistry`**: Warehouses and buying stations (`name`, `type`, `code`, `address`).
- **`PaddyPriceSpec`**: Price specifications (`variety`, `grade`, `basePrice`, `maxMoisture`, `maxForeignMatter`).
- **`FarmerProfile`**: Farmer payment profiles (`familyCode`, `farmerName`, `village`, `phone`, `paymentMethod`, `bankName`, `accountNumber`, `accountHolder`, `relationship`, `bankDocumentUrl`).
- **`SpecsRecord`**: Quality inspection records (`familyCode`, `farmerName`, `village`, `paddyType`, `selectedGrade`, `moisture`, `foreignMatter`, `basePrice`, `finalPrice`).
- **`PurchaseRecord`**: Purchase invoices (`familyCode`, `farmerName`, `village`, `totalWeight`, `totalPayment`, `netPayment`, `signatureFarmer`, `signatureStaff`, `purchasingStaffId`, `purchasingStaffName`, `specsRecordId`, `transportRecordId`, `status`).
- **`PurchaseItem`**: Individual items in purchase (`variety`, `grade`, `standardPrice`, `additionalPrice`, `finalPrice`, `sacks`, `totalValue`, `sackWeights` JSON).
- **`TransportRecord`**: Transport dispatches (`driverName`, `plateNumber`, `loadingLocation`, `destinationWarehouse`, `totalSacks`, `totalFieldWeight`, `status`).
- **`WarehouseIntake`**: Scale receiving records (`warehouseGrossWeight`, `warehouseTareWeight`, `warehouseNetWeight`, `weightDiffKg`, `weightDiffPercent`, `grossScalePhotoUrl`, `tareScalePhotoUrl`, `transportInvoiceUrl`, `inventoryLocation`, `inventoryStatus`, `status`).
- **`AuditLog`**: System activity logs (`userId`, `userName`, `userRole`, `action`, `entityType`, `entityId`, `details`, `timestamp`).
- **`SystemSetting`**: System configuration key-values (`SCALE_TOLERANCE_PERCENT`, etc.).

---

## 4. User Roles & Access Control (RBAC)

NextAuth session role-based permissions strictly enforced across UI navigation, page guards, and API endpoints (`/api/admin/*`):

| Role Code | Role Title | Accessible Module / Tab Scope | Restrictions |
|---|---|---|---|
| `FIELD` | 🌾 **Field Team** | **Field Operations Only** (Quality Specs, Farmer Payment Profile, Purchase Record, Transport Dispatch) | Restricted from Warehouse, Inventory, Finance, and Admin Settings. |
| `WAREHOUSE` | 🏬 **Warehouse Receiver** | **Warehouse Receiving Only** (Gross/Tare Scale Weighbridge Intake) | Restricted from Field, Inventory, Finance, and Admin Settings. |
| `INVENTORY` | 📦 **Inventory Team** | **Inventory Record Only** (Silo/Stack Location Confirmation) | Restricted from Field, Warehouse, Finance, and Admin Settings. |
| `FINANCE` | 💳 **Finance Team** | **Finance Verification Only** (Weighbridge Reconciliation & Disbursements) | Restricted from Field, Warehouse, Inventory, and Admin Settings. |
| `ADMIN` | ⚙️ **System Admin** | **Full System Access** (All 5 Modules + `/admin/config` Master Settings) | Unrestricted. |

### Demo Credentials (`username_roles.csv`):
- **Field Team**: `piseth` / `PVH-piseth-2026`
- **Warehouse Receiver**: `phearun` / `KPT-phearun-2026`
- **Inventory Team**: `bousong` / `PNH-bousong-2026`
- **Finance Team**: `heap` / `ST-heap-2026`
- **System Admin**: `chansetha` / `ST-chansetha-2026`

---

## 5. Master Data Structure

Master datasets are driven 100% dynamically from configuration files and PostgreSQL database tables (zero hardcoded fallback arrays):

1. **User Accounts (`username_roles.csv`)**: 26 official team accounts across 4 provinces.
2. **Target Villages (`villages_province_grade_warehouse.xlsx` - Sheet 1)**: 61 registered villages across Preah Vihear, Stung Treng, Ratanakiri, Mondulkiri.
3. **Paddy Price Specs & Grading (`villages_province_grade_warehouse.xlsx` - Sheet 2)**:
   - **Phka Rumduol**: Grades `A1` (1650), `A2` (1550), `B1` (1500), `B2` (1450)
   - **Red Jasmine**: Grades `A1` (1850), `A2` (1750), `B1` (1700), `B2` (1650)
   - **Foundation Seed - Phka Rumduol**: Grade `A` (2050)
   - **Foundation Seed - Red Jasmine**: Grade `A` (2150)
   - **Certified Seed**: Grade `A` (1900)
   - **White Rice**: Grades `A` (1320), `B` (1220)
4. **Destination Warehouses (`villages_province_grade_warehouse.xlsx` - Sheet 3)**:
   - `CACC (KPT)`
   - `Amru Nature (KPG)`
   - `Other`

---

## 6. Coding Standards & Naming Conventions

- **Next.js Conventions**: Next.js 16 App Router pattern (`src/app/page.tsx`, `src/app/api/.../route.ts`).
- **Styling**: Vanilla TailwindCSS with dark mode aesthetic (`#0f172a`, `#1e293b`, `#141c2f`).
- **File Uploads**: `src/app/api/upload/route.ts` handles image uploads, writing to `public/uploads/` and returning `/uploads/<filename>`.
- **Image Display Components**: Custom image containers support preview, modal view, zoom, and fallback handling for missing URLs.
- **Searchable Components**: Reusable components (`SearchableVillageSelect.tsx`, `SearchableBankSelect.tsx`) provide type-to-search dropdowns.
- **State Management**: React `useState` / `useEffect` with clean resets (`resetSpecsForm`, `resetFarmerProfileForm`, `resetPurchaseForm`, `resetTransportForm`).

---

## 7. Current Implementation Status & Recent Completed Tasks

### Completed Tasks:
1. **Image Upload & Preview Fixes**:
   - Fixed broken preview icons across all 7 image upload locations (Farmer signature, Purchasing staff signature, Bank document photo, Gross scale photo, Tare scale photo, Transport invoice photo).
   - Created `/uploads/[filename]/route.ts` static file server fallback to guarantee image rendering across dev and production.
2. **Usability & Default Values**:
   - Removed default pre-selections for Village and Paddy Category (now starts blank with placeholders `"Select Target Village..."` & `"Select Paddy Category..."`).
   - Removed obsolete `+100 KHR Bonus` display text.
3. **Role-Based Access Control (RBAC)**:
   - Integrated Inventory Team role.
   - Filtered top navigation tabs dynamically per user role.
   - Added access restriction guards to `/admin/config` and `/api/admin/*`.
4. **Searchable Master Data & Dropdowns**:
   - Converted Village dropdowns to searchable components (`SearchableVillageSelect`).
   - Converted Loading Location to searchable village select.
   - Converted Destination Warehouse to restricted dropdown (`CACC (KPT)`, `Amru Nature (KPG)`, `Other`).
5. **Excel Master Grading & Pricing**:
   - Dynamically filtered Grade dropdown options based on selected Paddy Category from Excel master data.
   - Linked standard base prices automatically.
6. **Purchased Quality Specs Card Styling & Flexible Confirmation Prompt**:
   - Updated `SpecsSelectorModal` to check purchased status based on exact spec ID (`purchase.specsRecordId === spec.id`) OR exact `Family Code + Variety + Grade`.
   - Allows farmers with multiple valid specs for different varieties/grades to render all records cleanly.
   - For records matching a previous purchase, renders a **"✓ Purchased (PR-2026-XXXXXX)"** badge and an **"👁️ View"** button for read-only inspection.
   - Clicking a purchased spec card or **Select** button prompts confirmation (`"This Quality Specs record (Family Code, Variety, Grade) has already been used for Purchase Record PR-2026-XXXXXX. Do you want to use it again?"`), giving full flexibility while preventing accidental duplicates.
7. **Step-by-Step Approval Chain & Linear Rejection Workflow**:
   - Enforced strict single-level step-by-step rejection hierarchy:
     `Transport (Field) → Warehouse → Inventory → Finance`
   - **Finance → Inventory**: Finance rejects strictly to `INVENTORY`. `WarehouseIntake.inventoryStatus` becomes `REJECTED`. Record returns to Inventory queue for location correction or secondary rejection to Warehouse.
   - **Inventory → Warehouse**: Inventory rejects strictly to `WAREHOUSE` (`entityType: 'WarehouseIntake'`, `targetModule: 'WAREHOUSE'`). Only `WarehouseIntake.status` and `inventoryStatus` become `REJECTED`; `TransportRecord.status` remains `RECEIVED`. Record returns to Warehouse Intakes receiving table with a **`🔴 RETURNED BY INVENTORY`** badge, an **`✏️ Edit & Resubmit`** button (to fix gross/tare scale weights or photos), and a **`Reject to Field`** button.
   - **Warehouse → Field**: Warehouse rejects to `FIELD` (`entityType: 'TransportRecord'`, `targetModule: 'FIELD'`). `TransportRecord.status` becomes `REJECTED`. Record returns to Field Transport list with an **`✏️ Edit & Resubmit`** button.
   - **Intake Resubmission**: When Warehouse staff edit and save a rejected `WarehouseIntake` (`PUT /api/warehouse/intake/[id]`), `status` resets to `RECEIVED`, `inventoryStatus` resets to `WAITING_FOR_INVENTORY`, active `RejectionLog` marks as `RESOLVED`, and the intake returns to Inventory queue.
8. **Warehouse Cargo Manifest Inspection & CSV Download**:
   - Enhanced **Select En-Route Truck** (Dispatched Truck Field Summary card) in Warehouse Receiving screen:
     - Added **`📥 Download Truck CSV`** button (`exportTransportTruckCSV`) so staff can download full farmer invoices and sack details.
     - Added **`👁️ View Details`** button (`setSelectedTransportForDetails`) to open full modal cargo manifest.
     - Added **`📋 Inspect Loaded Farmer Invoices & Sack Weights Breakdown`** expandable table showing Invoice IDs (`PR-2026-XXXXXX`), farmer names, family codes, villages, paddy varieties/grades, sack counts, field net weights, and individual sack weight arrays.
8. **Warehouse Receiving Dashboard Metrics Cards**:
   - Added real-time summary dashboard cards above `Select En-Route Truck` in the Warehouse Receiving module:
     - 🚚 `Trucks En Route: XX`
     - 📍 `Trucks Received Today: XX`
     - ⏳ `Waiting for Receiving: XX`
9. **Finance Module Status Labels & Button Simplification**:
   - Standardized Finance table status badges and dropdown filter labels to:
     - `⏳ Pending Inventory`
     - `📦 Inventory Recorded`
     - `✅ Payment Complete`
   - Renamed action button from `"Verify & Approve"` to simply `"Verify"`.
24. **Sack Weighing Entry Integer Formatting & Distinct Badge Styling (`src/app/page.tsx` & `PurchaseDetailsModal.tsx`)**:
   - Formatted all individual sack weights and total quantity as clean integers (e.g. `100 kg` instead of `100.0 kg`).
   - Rendered the sack index (`#1`, `#2`, `#10`) inside a distinct highlighted badge tag (`bg-emerald-500/20 text-emerald-300 font-extrabold px-1.5 py-0.5 rounded text-[10px]`), separating it from the bold white integer weight (`100 kg`) to prevent confusion during verification.

---

## 8. Verification Commands & Scripts

When resuming work or making changes, run these verification commands:

```bash
# 1. Type Check TypeScript Codebase
cmd.exe /c "npx tsc --noEmit"

# 2. Production Build Check
cmd.exe /c "npm run build"

# 3. Re-seed Master Database (if needed)
cmd.exe /c "npx prisma db seed"

# 4. Check Database Row Counts
cmd.exe /c "npx tsx scripts/check-counts.ts"

# 5. Start Local Production Server
cmd.exe /c "npm run start"
```

---

## 9. Future Roadmap & Developer Next Steps

1. **Offline Sync & PWA Storage**:
   - Implement IndexedDB offline queue in `field_app` for field staff capturing purchases without internet connectivity.
2. **Mobile APK Build Automation**:
   - Build Android APK via `build-android-apk.bat` for field mobile testing.
3. **Automated Export & PDF Reports**:
   - Enhance PDF print receipts (`PrintReceiptModal.tsx`, `PrintManifestModal.tsx`) for thermal Bluetooth printer compatibility.
4. **Multi-Tenant Province Scope**:
   - Scope viewable purchase records automatically based on `user.assignedProvinces`.
