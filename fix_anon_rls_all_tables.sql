-- ==============================================================================
-- Full Anon Role RLS Policy Migration for Supabase Database
-- Grants 100% full CRUD (SELECT, INSERT, UPDATE, DELETE) access to 'anon' role.
-- Removes reliance on 'authenticated' policies.
-- ==============================================================================

-- 1. master_employees
ALTER TABLE master_employees ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon all on master_employees" ON master_employees;
DROP POLICY IF EXISTS "Allow public access on master_employees" ON master_employees;
CREATE POLICY "Allow anon all on master_employees"
ON master_employees FOR ALL TO anon USING (true) WITH CHECK (true);

-- 2. salary_months
ALTER TABLE salary_months ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon all on salary_months" ON salary_months;
DROP POLICY IF EXISTS "Allow public access on salary_months" ON salary_months;
CREATE POLICY "Allow anon all on salary_months"
ON salary_months FOR ALL TO anon USING (true) WITH CHECK (true);

-- 3. salary_item_types
ALTER TABLE salary_item_types ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon all on salary_item_types" ON salary_item_types;
DROP POLICY IF EXISTS "Allow public access on salary_item_types" ON salary_item_types;
CREATE POLICY "Allow anon all on salary_item_types"
ON salary_item_types FOR ALL TO anon USING (true) WITH CHECK (true);

-- 4. schedule_months
ALTER TABLE schedule_months ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon all on schedule_months" ON schedule_months;
DROP POLICY IF EXISTS "Allow public access on schedule_months" ON schedule_months;
CREATE POLICY "Allow anon all on schedule_months"
ON schedule_months FOR ALL TO anon USING (true) WITH CHECK (true);

-- 5. schedule_weeks
ALTER TABLE schedule_weeks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon all on schedule_weeks" ON schedule_weeks;
DROP POLICY IF EXISTS "Allow public access on schedule_weeks" ON schedule_weeks;
CREATE POLICY "Allow anon all on schedule_weeks"
ON schedule_weeks FOR ALL TO anon USING (true) WITH CHECK (true);

-- 6. schedule_shifts
ALTER TABLE schedule_shifts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon all on schedule_shifts" ON schedule_shifts;
DROP POLICY IF EXISTS "Allow public access on schedule_shifts" ON schedule_shifts;
CREATE POLICY "Allow anon all on schedule_shifts"
ON schedule_shifts FOR ALL TO anon USING (true) WITH CHECK (true);

-- 7. stores
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon all on stores" ON stores;
DROP POLICY IF EXISTS "Allow public access on stores" ON stores;
CREATE POLICY "Allow anon all on stores"
ON stores FOR ALL TO anon USING (true) WITH CHECK (true);

-- 8. app_settings
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon all on app_settings" ON app_settings;
DROP POLICY IF EXISTS "Allow public access on app_settings" ON app_settings;
CREATE POLICY "Allow anon all on app_settings"
ON app_settings FOR ALL TO anon USING (true) WITH CHECK (true);
