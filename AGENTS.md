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
2. **Database Invariants**:
   - Provider: PostgreSQL on `localhost:5432` with database `ibis_db`.
   - Master configuration data (Users, Villages, Banks, PriceSpecs, LocationRegistry) must always be preserved.
   - To reset test data cleanly, use `npx tsx scripts/clean-database.ts`.
   - To create a backup, use `npx tsx scripts/backup-database.ts`.
