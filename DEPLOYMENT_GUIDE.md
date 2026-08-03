# IBIS RICE System Deployment & Complete User Operations Guide

Official deployment instructions and end-to-end user manual for **IBIS RICE CONSERVATION CO., LTD** Digitalization & Field Operations Payment Platform.

---

## 📋 Table of Contents

1. [System Architecture & Workflow Overview](#-system-architecture--workflow-overview)
2. [Server Setup & LAN Deployment (Web Application)](#-server-setup--lan-deployment-web-application)
3. [Android Tablet Setup & Installation (Mobile Application)](#-android-tablet-setup--installation-mobile-application)
4. [Complete User Operations Guide](#-complete-user-operations-guide)
   - [Module 1: Quality Inspection Specs Record](#module-1-quality-inspection-specs-record)
   - [Module 2: Farmer Payment Profile Registration](#module-2-farmer-payment-profile-registration)
   - [Module 3: Paddy Purchase Receipt & Net Payment](#module-3-paddy-purchase-receipt--net-payment)
   - [Module 4: Transport Truck Dispatch & Manifest](#module-4-transport-truck-dispatch--manifest)
   - [Module 5: Warehouse Scale Intake & Tolerance Verification](#module-5-warehouse-scale-intake--tolerance-verification)
   - [Module 6: Finance Bank Disbursement & Reconciliation](#module-6-finance-bank-disbursement--reconciliation)
   - [Module 7: Web Administration & Master Data Portal](#module-7-web-administration--master-data-portal)
5. [Offline Data Synchronization Protocol](#-offline-data-synchronization-protocol)
6. [Troubleshooting & FAQ](#-troubleshooting--faq)

---

## 🏗️ System Architecture & Workflow Overview

The **IBIS RICE Platform** consists of two tightly integrated components:

1. **Central Web Application & REST API Server** (Next.js 16 + PostgreSQL + Prisma ORM)
   - Operates on a dedicated desktop/server computer connected to your Local Area Network (LAN).
   - Serves as the central database, administration hub, warehouse scale intake terminal, and finance disbursement station.
2. **Field Tablet Application** (Flutter Android Native + Embedded SQLite)
   - Runs on physical Android tablets used by field inspectors in remote villages.
   - Operates **100% offline** without internet or mobile signal during data collection.
   - Automatically synchronizes all captured records back to the central PostgreSQL server once connected to the server's LAN Wi-Fi network.

```
       [ Android Tablet (Village A) ] -- (Offline SQLite) --\
                                                              \ -- (Wi-Fi LAN Sync) --> [ Central PostgreSQL Server ]
       [ Android Tablet (Village B) ] -- (Offline SQLite) --/                              |
                                                                                           |--> [ Web Dashboard & Admin ]
                                                                                           |--> [ Warehouse Scale Intake ]
                                                                                           |--> [ Finance Disbursement ]
```

---

## 🖥️ Server Setup & LAN Deployment (Web Application)

### Prerequisites on Server Computer:
- **Operating System**: Windows 10/11 or Linux.
- **Node.js**: v18.0.0 or higher ([Download Node.js](https://nodejs.org/)).
- **PostgreSQL**: v14.0 or higher ([Download PostgreSQL](https://www.postgresql.org/download/)).

---

### Step 1: Extract Package & Configure Environment

1. Extract **`ibis-rice-deployment.zip`** into a folder on your server computer (e.g. `C:\IBIS_RICE_System`).
2. Make a copy of `.env.example` in the root folder and rename it to **`.env`**.
3. Open `.env` in Notepad and set your local PostgreSQL database connection string:
   ```env
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/ibis_db?schema=public"
   ```

---

### Step 2: Provision PostgreSQL Database & Seed Master Data

Open Command Prompt / PowerShell in your project folder (`C:\IBIS_RICE_System`) and run:

```powershell
# 1. Install Node.js dependencies
npm install

# 2. Run 1-Click Database Setup & Master Data Seed
.\switch-to-postgresql.bat
```

*This script creates all tables in your PostgreSQL database (`ibis_db`) and seeds initial target villages, commercial banks, price specs, and default user accounts.*

---

### Step 3: Configure Windows Firewall for LAN Access

To allow tablets and other computers on your Wi-Fi/LAN network to access the web application:

1. Open PowerShell as **Administrator** and run:
   ```powershell
   New-NetFirewallRule -DisplayName "IBIS RICE Server (Port 3000)" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
   ```
2. Find your server computer's LAN IP address by running:
   ```powershell
   ipconfig
   ```
   *(Look for **IPv4 Address**, e.g., `192.168.1.100`)*.

---

### Step 4: Launch Production Web Server

Double-click **`start-production-local.bat`** (or run `npm run start`).

The Web Application will start on **`http://0.0.0.0:3000`** and is accessible across your local network at:
- **Local Desktop**: `http://localhost:3000`
- **LAN Network URL**: `http://192.168.1.100:3000` *(Replace with your server IPv4)*
- **Admin Configuration Portal**: `http://192.168.1.100:3000/admin/config`

---

## 📱 Android Tablet Setup & Installation (Mobile Application)

### Step 1: Install APK on Android Tablet

1. Locate **`ibis-rice-field-app-v1.0.apk`** in your deployment folder.
2. Copy the APK file to your Android tablet via USB cable, SD Card, or Google Drive.
3. Tap the `.apk` file on the tablet to install. *(If prompted, enable "Allow installation from unknown sources")*.

---

### Step 2: Initial Server Connection & Initial Sync

1. Connect your Android tablet to the **same Wi-Fi network** as the server computer.
2. Open the **IBIS RICE Mobile App** on the tablet.
3. Tap the **Server IP Settings** (⚙️) icon in the top header:
   - Enter your server computer's LAN IP address: `http://192.168.1.100:3000`
   - Tap **Save & Test Connection**.
4. Tap the **Sync Now** (🔄) button in the top header.
   - The app will perform an **Initial Sync**, downloading the latest target villages, paddy categories, quality thresholds, and base purchase prices to local SQLite storage.

---

### Step 3: Go Offline into Remote Fields

Once initial synchronization completes:
- The tablet is **100% self-sufficient**. Field inspectors can turn off Wi-Fi and take the tablet to remote villages.
- All records (Quality Specs, Farmer Payment Profiles, Purchase Invoices, Transport Manifests) will save **100% offline** with instant speed.

---

## 📖 Complete User Operations Guide

### Initial Login Credentials (Default Roles)

| Role | Username / Email | Password | Access Module |
| :--- | :--- | :--- | :--- |
| **Field Inspector** | `field@ibisrice.org` | `Ibis2026!` | Specs, Farmers, Purchases, Transport |
| **Warehouse User** | `warehouse@ibisrice.org` | `Ibis2026!` | Truck Intake Scale & Net Comparison |
| **Finance User** | `finance@ibisrice.org` | `Ibis2026!` | Payment Reconciliation & Bank Disbursement |
| **Administrator** | `admin@ibisrice.org` | `Ibis2026!` | Master Data, User Accounts, Pricing & Config |

---

### Module 1: Quality Inspection Specs Record

Used by Field Inspectors to test paddy quality before purchasing.

1. Select **Quality Inspection** from the side menu.
2. Enter **Family Code** and select **Village** *(Primary matching key `Family Code + Village`)*.
3. If basic farmer info exists from Farmer Payment Profile, it will **auto-load**.
4. Select **Paddy Variety** (e.g. *Phka Rumduol / Red Jasmine*) and toggle **Organic Certification**.
5. Input physical lab measurements:
   - **Moisture %** (e.g. `13.5%`)
   - **Foreign Matter %** (e.g. `4.0%`)
   - **Whole Grain %** & **Broken Rice %**
6. The app automatically evaluates quality specifications and calculates **Final Purchase Price (KHR/kg)**:
   $$\text{Final Price/kg} = \text{Base Price} + \text{Organic Bonus}$$
7. Tap **Save Specs Record**.

---

### Module 2: Farmer Payment Profile Registration

Used to collect the farmer's bank account information and passbook photo to prevent payment typos.

1. Select **Farmer Payment Info** from the side menu.
2. Enter **Family Code** and **Village**.
   - If a Quality Specs record exists for this farmer, basic details **auto-fill**.
3. Select **Payment Method**:
   - **Bank Transfer** (ABA Bank, ACLEDA, Wing, Canadia, etc.)
   - **Cash**
4. Enter **Account Number**, **Account Holder Name**, and **Relationship** (Self, Spouse, Son, Daughter).
5. Tap **Take Passbook Photo** to scan the physical bank book/card.
6. Tap **Save Payment Profile**.

---

### Module 3: Paddy Purchase Receipt & Net Payment

Used during paddy weighing to generate the purchase receipt.

1. Select **Paddy Purchasing** from the side menu.
2. Enter **Family Code** and **Village** -> Tap **Load Farmer & Quality Specs**.
   - The app automatically links the quality specs, grade, and final purchase price.
3. Input **Per-Kg Additional Premium** (if applicable, e.g. distance/ferry bonus).
4. Enter **Individual Sack Weights (kg)** (e.g. `100 + 100 + 100`).
5. Input **Seed Borrowed (kg)** if the farmer borrowed seed.
   - The app automatically calculates returned seed quantity with **10% interest**:
     $$\text{Returned Seed} = \text{Seed Borrowed} \times 1.10$$
   - And calculates Seed Deduction using the **Final Purchase Price per kg**:
     $$\text{Seed Deduction} = \text{Returned Seed} \times \text{Final Price/kg}$$
   - And calculates Net Payment:
     $$\text{Net Payment} = \text{Gross Value} - \text{Seed Deduction}$$
6. Collect **Farmer Touchscreen Signature** and **Inspector Signature**.
7. Tap **Save & Print Purchase Receipt** (Supports Bluetooth thermal printer).

---

### Module 4: Transport Truck Dispatch & Manifest

Used when loading purchased paddy onto transport trucks for shipment to the central mill.

1. Select **Transport Dispatch** from the side menu.
2. Select **Loading Location** (Buying Station) and **Destination Warehouse**.
3. Enter **Driver Name**, **Truck Plate Number**, and **Driver Mobile**.
4. Check **Truck Cleanliness & Tarpaulin Certified Clean**.
5. Tap **Load Purchase Invoices**:
   - Select all paddy purchase receipts loaded onto this truck.
6. Tap **Save Transport Manifest** -> Receipts transition to **`IN_TRANSIT`** status.

---

### Module 5: Warehouse Scale Intake & Tolerance Verification

Used by Warehouse Staff when transport trucks arrive at the central mill.

1. Log in to the Web Portal -> Select **Warehouse Intake** module.
2. Select arriving truck by **Plate Number** / **Manifest ID**.
3. Perform double-weighing on certified weighbridge scale:
   - Input **Gross Scale Weight (kg)** (Truck + Paddy).
   - Input **Tare Scale Weight (kg)** (Empty Truck).
4. System calculates **Net Warehouse Weight** and compares against total field cargo weight:
   $$\text{Weight Difference (kg)} = \text{Warehouse Net Weight} - \text{Field Cargo Weight}$$
5. System displays color-coded scale tolerance indicator:
   - 🟢 **Green (Acceptable)**: Difference $\le$ Configured Tolerance Limit (e.g. 300 kg).
   - 🟡 **Yellow (Warning)**: Difference exceeds acceptable limit.
   - 🔴 **Red (Critical)**: High discrepancy requiring investigation.
6. Upload scale weight display photo -> Tap **Confirm Warehouse Intake**.

---

### Module 6: Finance Bank Disbursement & Reconciliation

Used by Finance Officers to disburse payments directly to farmer bank accounts.

1. Log in to the Web Portal -> Select **Finance Disbursement** module.
2. View incoming truck dispatches with verified warehouse net weights.
3. Review itemized farmer payment profiles, bank account numbers, and passbook photos.
4. Select payment batch -> Export **ABA / ACLEDA Bulk Transfer CSV**.
5. Process electronic bank transfers -> Tap **Mark Batch as Disbursed**.

---

### Module 7: Web Administration & Master Data Portal

Used by System Administrators to adjust business parameters without code modifications.

Access via top navigation or **`http://<SERVER_IP>:3000/admin/config`**:

1. **Paddy Varieties & Pricing**: Add/edit varieties (Red Jasmine, Phka Rumduol), grades (A1, B1), base prices, and organic bonus.
2. **Target Villages**: Manage active villages, districts, and provinces.
3. **Commercial Banks**: Manage supported banks and branches.
4. **Scale Tolerance Thresholds**: Adjust acceptable, warning, and critical weight tolerance limits (kg).
5. **Locations & Fleet**: Manage buying stations, warehouses, and fleet vehicles.
6. **User Management**: Create user accounts, assign roles, reset passwords, or activate/deactivate accounts.
7. **Security Audit Logs**: Track every data creation, modification, intake, and disbursement.

---

## 🔄 Offline Data Synchronization Protocol

When field tablets return from remote villages to the buying station:

```
[ Step 1: Connect Wi-Fi ] ---> [ Step 2: Open App ] ---> [ Step 3: Tap 'Sync Now' ] ---> [ Step 4: Verification ]
Connect to Server Wi-Fi       Header shows 'Online'      Pushes offline records        Web Portal displays
(192.168.1.100:3000)                                     to central PostgreSQL         synced receipts!
```

- If internet connection drops during sync, records remain safely stored in local SQLite storage.
- Once connection is restored, tapping **`Sync Now`** resumes synchronization cleanly with **zero data loss**.

---

## ❓ Troubleshooting & FAQ

### Q1: The mobile app says "Server Connection Error" during sync.
- **Solution**: 
  1. Ensure the tablet is connected to the same Wi-Fi network as the server.
  2. Verify the server IP in mobile app settings (⚙️) matches `http://YOUR_SERVER_IP:3000`.
  3. Ensure Windows Firewall on the server computer has port 3000 allowed (`New-NetFirewallRule`).

### Q2: How do I change paddy base prices or seed return interest rate?
- **Solution**: Log in to the Web Administration Portal (`/admin/config`), update the price specs or seed return rate, and save. Tablets will receive the updated values on their next online sync!

### Q3: What happens if two farmers have the same Family Code?
- **Solution**: The system uses the composite key **`(Family Code + Village)`** as the primary unique identifier everywhere, ensuring zero collisions even if family codes are identical across different villages.
