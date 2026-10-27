<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# IBIS Rice Development Rules & UI Baseline

1. **Current UI is the Accepted Baseline**:
   - Do NOT redesign, re-theme, or change card layouts/spacing unless explicitly requested by the user.
   - **Specs Record Tab**: Left card is compact; Right history list has `h-[320px] overflow-y-auto`.
   - **Farmer Payment Info Tab**: Left registration card is naturally compact (`items-start`); Right profiles list has `h-[455px] xl:h-[460px] overflow-y-auto`.
   - Never stretch form cards vertically to fill artificial dead space.
   - **Warehouse Receiving Tab**: Metric KPI cards show prominent numbers; Gross and Tare weight inputs must suppress spinners (`.no-spinners`) and disable scroll-wheel modifications (`onWheel` blur).
   - **Warehouse Receiving History**: Column header is `Receiving ID` with badge formatted as `username_WarehouseCode` (e.g. `phearun_W002`). Driver & Plate column contains driver name and plate number only.

2. **System Identifier Standards**:
   - **Purchase ID**: `FamilyCode_DDMMYY_24H` (e.g. `TB010_261026_10`) via `src/lib/purchase-id.ts`.
   - **Receiving ID**: `username_WarehouseCode` (e.g. `phearun_W002`) on history table badge; `username_WarehouseCode_DDMMYY` (e.g. `phearun_W003_271026`) in truck-level warehouse CSV exports via `src/lib/warehouse-config.ts`.
   - **Arrived Warehouse Invariant**: Always store the actual arrived warehouse in `WarehouseIntake.arrivedWarehouse`; never overwrite `TransportRecord.destinationWarehouse`.

3. **Database Invariants**:
   - Provider: PostgreSQL on `localhost:5432` with database `ibis_db`.
   - Master configuration data (Users, Villages, Banks, PriceSpecs, LocationRegistry) must always be preserved.
   - To reset test data cleanly, use `npx tsx scripts/clean-database.ts`.
   - To create a backup, use `npx tsx scripts/backup-database.ts`.

4. **Version Control Constraint**:
   - Never execute `git commit` or `git push` unless the user explicitly asks to commit or push.
