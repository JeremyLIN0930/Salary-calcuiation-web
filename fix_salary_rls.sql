-- ==============================================================================
-- Fix Supabase Row Level Security (RLS) Policies for salary_months, schedule_weeks, stores
-- Resolves HTTP 401 / PostgreSQL 42501 "new row violates row-level security policy"
-- ==============================================================================

-- 1. salary_months
ALTER TABLE salary_months ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon all on salary_months" ON salary_months;

CREATE POLICY "Allow anon all on salary_months"
ON salary_months
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- 2. schedule_weeks
ALTER TABLE schedule_weeks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon all on schedule_weeks" ON schedule_weeks;

CREATE POLICY "Allow anon all on schedule_weeks"
ON schedule_weeks
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- 3. stores
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon all on stores" ON stores;

CREATE POLICY "Allow anon all on stores"
ON stores
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);
