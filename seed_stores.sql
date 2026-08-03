-- ==============================================================================
-- Store Migration & Seed Data
-- Ensures only 001 慶東門市 and 002 南醫門市 exist. Removes '總店'.
-- ==============================================================================

-- 1. Remove legacy '總店'
DELETE FROM stores WHERE store_name = '總店';

-- 2. Upsert official stores
INSERT INTO stores (id, store_code, store_name, is_active)
VALUES 
  ('b357ddf1-7024-4a0a-8aa0-66c62214dbeb', '001', '慶東門市', true),
  ('c468eee2-8135-5b1b-9bb1-77d73325ecef', '002', '南醫門市', true)
ON CONFLICT (id) DO UPDATE 
SET 
  store_code = EXCLUDED.store_code,
  store_name = EXCLUDED.store_name,
  is_active  = EXCLUDED.is_active;
