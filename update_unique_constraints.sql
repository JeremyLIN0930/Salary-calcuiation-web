-- ==============================================================================
-- SQL Migration: Update Constraints and Foreign Keys for Roster Support
-- Run this script in your Supabase Dashboard SQL Editor if not already updated.
-- ==============================================================================

-- 0. Ensure store_id column exists on schedule_months
ALTER TABLE schedule_months ADD COLUMN IF NOT EXISTS store_id UUID;

-- 1. Ensure foreign key on schedule_months.store_id referencing stores.id
ALTER TABLE schedule_months DROP CONSTRAINT IF EXISTS fk_schedule_months_stores;
ALTER TABLE schedule_months ADD CONSTRAINT fk_schedule_months_stores FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;

-- 2. Drop old constraints on schedule_months and add multi-store unique constraint
ALTER TABLE schedule_months DROP CONSTRAINT IF EXISTS uq_schedule_month;
ALTER TABLE schedule_months DROP CONSTRAINT IF EXISTS schedule_months_company_id_year_month_key;
ALTER TABLE schedule_months DROP CONSTRAINT IF EXISTS uq_schedule_month_store;

ALTER TABLE schedule_months ADD CONSTRAINT uq_schedule_month_store UNIQUE(company_id, store_id, year, month);

-- 3. Ensure foreign key on schedule_weeks.schedule_month_id referencing schedule_months.id
ALTER TABLE schedule_weeks DROP CONSTRAINT IF EXISTS fk_schedule_weeks_schedule_months;
ALTER TABLE schedule_weeks ADD CONSTRAINT fk_schedule_weeks_schedule_months FOREIGN KEY (schedule_month_id) REFERENCES schedule_months(id) ON DELETE CASCADE;

-- 4. Ensure schedule_weeks unique constraint on (schedule_month_id, week_no)
ALTER TABLE schedule_weeks DROP CONSTRAINT IF EXISTS uq_schedule_week;
ALTER TABLE schedule_weeks DROP CONSTRAINT IF EXISTS schedule_weeks_schedule_month_id_week_no_key;

ALTER TABLE schedule_weeks ADD CONSTRAINT uq_schedule_week UNIQUE(schedule_month_id, week_no);

-- 5. Ensure foreign key on schedule_shifts.schedule_week_id referencing schedule_weeks.id
ALTER TABLE schedule_shifts DROP CONSTRAINT IF EXISTS fk_schedule_shifts_schedule_weeks;
ALTER TABLE schedule_shifts ADD CONSTRAINT fk_schedule_shifts_schedule_weeks FOREIGN KEY (schedule_week_id) REFERENCES schedule_weeks(id) ON DELETE CASCADE;

-- 6. Ensure schedule_shifts unique constraint on (schedule_week_id, employee_id, work_date)
ALTER TABLE schedule_shifts DROP CONSTRAINT IF EXISTS uq_schedule_shift;
ALTER TABLE schedule_shifts DROP CONSTRAINT IF EXISTS schedule_shifts_schedule_week_id_employee_id_work_date_key;

ALTER TABLE schedule_shifts ADD CONSTRAINT uq_schedule_shift UNIQUE(schedule_week_id, employee_id, work_date);
