-- ==============================================================================
-- SQL Migration: Create salary_items Table and Grant Anon Access
-- Run this script in your Supabase Dashboard SQL Editor if not already created.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS salary_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salary_month_id UUID NOT NULL REFERENCES salary_months(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES master_employees(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT uq_salary_month_employee UNIQUE (salary_month_id, employee_id)
);

-- Enable RLS
ALTER TABLE salary_items ENABLE ROW LEVEL SECURITY;

-- Grant Anon CRUD access
DROP POLICY IF EXISTS "Allow anon all on salary_items" ON salary_items;
CREATE POLICY "Allow anon all on salary_items"
ON salary_items FOR ALL TO anon USING (true) WITH CHECK (true);
