-- DropIndex
DROP INDEX "PaddyPriceSpec_variety_grade_key";

-- AlterTable
ALTER TABLE "PaddyPriceSpec" ADD COLUMN     "region" TEXT NOT NULL DEFAULT 'Preah Vihear and Mondolkiri';

-- CreateIndex
CREATE INDEX "PaddyPriceSpec_region_status_idx" ON "PaddyPriceSpec"("region", "status");

-- CreateIndex
CREATE UNIQUE INDEX "PaddyPriceSpec_region_variety_grade_key" ON "PaddyPriceSpec"("region", "variety", "grade");

-- Upsert official 2026 regional paddy prices & quality specifications (Source: villages_province_grade_warehouse.xlsx -> specs_price_2026)
INSERT INTO "PaddyPriceSpec" ("id", "region", "variety", "grade", "basePrice", "maxMoisture", "maxForeignMatter", "minWholeGrain", "maxBrokenRice", "impurity", "moistureRange", "status", "createdAt", "updatedAt")
VALUES
  -- Region 1: Preah Vihear and Mondolkiri
  ('spec_2026_r1_pr_a1', 'Preah Vihear and Mondolkiri', 'Phka Rumduol', 'A1', 1750, 13.5, 6, 75, 25, 2, '13 - 14', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('spec_2026_r1_pr_a2', 'Preah Vihear and Mondolkiri', 'Phka Rumduol', 'A2', 1650, 14.0, 6, 70, 30, 4, '13 - 15', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('spec_2026_r1_pr_b1', 'Preah Vihear and Mondolkiri', 'Phka Rumduol', 'B1', 1600, 14.0, 6, 60, 40, 2, '13 - 15', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('spec_2026_r1_pr_b2', 'Preah Vihear and Mondolkiri', 'Phka Rumduol', 'B2', 1550, 14.0, 6, 50, 50, 4, '13 - 15', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('spec_2026_r1_rj_a1', 'Preah Vihear and Mondolkiri', 'Red Jasmine', 'A1', 1990, 13.5, 6, 75, 25, NULL, '13 - 14', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('spec_2026_r1_rj_a2', 'Preah Vihear and Mondolkiri', 'Red Jasmine', 'A2', 1890, 14.0, 6, 70, 30, NULL, '13 - 15', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('spec_2026_r1_rj_b1', 'Preah Vihear and Mondolkiri', 'Red Jasmine', 'B1', 1840, 14.0, 6, 60, 40, NULL, '13 - 15', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('spec_2026_r1_rj_b2', 'Preah Vihear and Mondolkiri', 'Red Jasmine', 'B2', 1790, 14.0, 6, 50, 50, NULL, '13 - 15', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('spec_2026_r1_fs_rj', 'Preah Vihear and Mondolkiri', 'Foundation Seed - Red Jasmine', 'A', 2250, 12.0, 1, 98, NULL, 1, '11 - 13', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('spec_2026_r1_fs_pr', 'Preah Vihear and Mondolkiri', 'Foundation Seed - Phka Rumduol', 'A', 2140, 12.0, 1, 98, NULL, 1, '11 - 13', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('spec_2026_r1_cs_a',  'Preah Vihear and Mondolkiri', 'Certified Seed', 'A', 1950, 12.0, 2, 96, NULL, 2, '11 - 13', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('spec_2026_r1_wr_a',  'Preah Vihear and Mondolkiri', 'White Rice', 'A', 1500, 13.5, 4, NULL, NULL, NULL, '13 - 14', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('spec_2026_r1_wr_b',  'Preah Vihear and Mondolkiri', 'White Rice', 'B', 1400, 13.5, 8, NULL, NULL, NULL, '13 - 14', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

  -- Region 2: Stung Treng and Ratanakiri
  ('spec_2026_r2_pr_a1', 'Stung Treng and Ratanakiri', 'Phka Rumduol', 'A1', 1650, 13.5, 6, 75, 25, 2, '13 - 14', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('spec_2026_r2_pr_a2', 'Stung Treng and Ratanakiri', 'Phka Rumduol', 'A2', 1550, 14.0, 6, 70, 30, 4, '13 - 15', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('spec_2026_r2_pr_b1', 'Stung Treng and Ratanakiri', 'Phka Rumduol', 'B1', 1500, 14.0, 6, 60, 40, 2, '13 - 15', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('spec_2026_r2_pr_b2', 'Stung Treng and Ratanakiri', 'Phka Rumduol', 'B2', 1450, 14.0, 6, 50, 50, 4, '13 - 15', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('spec_2026_r2_rj_a1', 'Stung Treng and Ratanakiri', 'Red Jasmine', 'A1', 1850, 13.5, 6, 75, 25, NULL, '13 - 14', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('spec_2026_r2_rj_a2', 'Stung Treng and Ratanakiri', 'Red Jasmine', 'A2', 1750, 14.0, 6, 70, 30, NULL, '13 - 15', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('spec_2026_r2_rj_b1', 'Stung Treng and Ratanakiri', 'Red Jasmine', 'B1', 1700, 14.0, 6, 60, 40, NULL, '13 - 15', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('spec_2026_r2_rj_b2', 'Stung Treng and Ratanakiri', 'Red Jasmine', 'B2', 1650, 14.0, 6, 50, 50, NULL, '13 - 15', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('spec_2026_r2_fs_rj', 'Stung Treng and Ratanakiri', 'Foundation Seed - Red Jasmine', 'A', 2250, 12.0, 1, 98, NULL, 1, '11 - 13', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('spec_2026_r2_fs_pr', 'Stung Treng and Ratanakiri', 'Foundation Seed - Phka Rumduol', 'A', 2140, 12.0, 1, 98, NULL, 1, '11 - 13', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('spec_2026_r2_cs_a',  'Stung Treng and Ratanakiri', 'Certified Seed', 'A', 1950, 12.0, 2, 96, NULL, 2, '11 - 13', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('spec_2026_r2_wr_a',  'Stung Treng and Ratanakiri', 'White Rice', 'A', 1400, 13.5, 4, NULL, NULL, NULL, '13 - 14', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('spec_2026_r2_wr_b',  'Stung Treng and Ratanakiri', 'White Rice', 'B', 1300, 13.5, 8, NULL, NULL, NULL, '13 - 14', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("region", "variety", "grade")
DO UPDATE SET
  "basePrice" = EXCLUDED."basePrice",
  "maxMoisture" = EXCLUDED."maxMoisture",
  "maxForeignMatter" = EXCLUDED."maxForeignMatter",
  "minWholeGrain" = EXCLUDED."minWholeGrain",
  "maxBrokenRice" = EXCLUDED."maxBrokenRice",
  "impurity" = EXCLUDED."impurity",
  "moistureRange" = EXCLUDED."moistureRange",
  "status" = 'ACTIVE',
  "updatedAt" = CURRENT_TIMESTAMP;
