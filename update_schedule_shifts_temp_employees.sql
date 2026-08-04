-- -----------------------------------------------------------------------------
-- SQL Migration Script: Support Temporary Employees in schedule_shifts
-- -----------------------------------------------------------------------------
-- Enables schedule_shifts to support temporary/one-week employees without 
-- requiring an entry in master_employees.
-- -----------------------------------------------------------------------------

-- 1. Add employee_name column to schedule_shifts
ALTER TABLE schedule_shifts ADD COLUMN IF NOT EXISTS employee_name TEXT;

-- 2. Make employee_id nullable for temporary employees
ALTER TABLE schedule_shifts ALTER COLUMN employee_id DROP NOT NULL;

-- 3. Re-create unique constraints/indexes to allow null employee_id for temporary employees
ALTER TABLE schedule_shifts DROP CONSTRAINT IF EXISTS uq_schedule_shift;
ALTER TABLE schedule_shifts DROP CONSTRAINT IF EXISTS schedule_shifts_schedule_week_id_employee_id_work_date_key;

-- Formal employees (employee_id is not null)
CREATE UNIQUE INDEX IF NOT EXISTS uq_schedule_shift_formal 
ON schedule_shifts (schedule_week_id, employee_id, work_date) 
WHERE employee_id IS NOT NULL;

-- Temporary employees (employee_id is null, grouped by employee_name)
CREATE UNIQUE INDEX IF NOT EXISTS uq_schedule_shift_temp 
ON schedule_shifts (schedule_week_id, employee_name, work_date) 
WHERE employee_id IS NULL;
