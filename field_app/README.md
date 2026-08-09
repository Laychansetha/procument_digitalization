# IBIS RICE Field Data Collection Application (Android Native)

Official mobile application for **IBIS RICE CONSERVATION CO., LTD** inspectors and field buying staff.

Designed specifically for **100% Offline Field Data Collection** in remote villages, featuring an embedded SQLite local database, camera passbook photo scanner, touch signature pad, Bluetooth thermal receipt printer driver, and background PostgreSQL API synchronization.

---

## 📱 Mobile Application Modules

1. **🌾 Quality Inspection Specs Record**
   - Moisture %, Foreign Matter %, Whole Grain %, Organic Premium Bonus (+150 KHR/kg).
   - Offline SQLite storage & automatic grading validation.

2. **👤 Farmer Payment Profile Registration**
   - Bank Account, Commercial Bank (ABA, ACLEDA, Wing, Canadia), Account Holder verification.
   - Camera photo capture of actual bank paper passbooks.

3. **🛒 Paddy Purchase Invoice & Weighing**
   - Individual sack weight array entry (e.g. `100 102 98.5`).
   - Organic price calculation & itemized seed return deductions.
   - Electronic farmer touch signature pad.
   - Bluetooth thermal receipt printing driver.

4. **🚛 Transport Truck Loading Manifest**
   - Truck plate number, driver details, truck cleanliness check.
   - Cargo loading assignment & ESC/POS Bluetooth manifest printing.

---

## 🚀 How to Run the App on Android

### Prerequisites
- Install Flutter SDK (`>=3.0.0`) from [flutter.dev](https://flutter.dev)
- Android Studio or VS Code with Flutter extension
- Android Device or Android Emulator

### Steps
```bash
# 1. Navigate into the mobile project directory
cd ibis_rice_field_app

# 2. Install Flutter package dependencies
flutter pub get

# 3. Connect your Android phone via USB (or start Emulator) and run:
flutter run
```

### Server Sync Configuration
In `lib/config/app_config.dart`:
- Set `baseUrl` to your central server's IP address (e.g. `http://192.168.1.10:3000` or `http://10.0.2.2:3000` for Android Emulator).
