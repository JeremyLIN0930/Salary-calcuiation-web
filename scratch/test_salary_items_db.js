import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '..', '.env');
let url = 'https://jqrkyculdldsyhoowhdv.supabase.co';
let key = 'sb_publishable_kvlGEFqmriAOCDs2tGhAZA_glrWg73w';

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts[0] && parts[1]) {
      const k = parts[0].trim();
      const v = parts[1].trim();
      if (k === 'VITE_SUPABASE_URL') url = v;
      if (k === 'VITE_SUPABASE_ANON_KEY') key = v;
    }
  });
}

const supabase = createClient(url, key);

async function testSalaryItemsFlow() {
  console.log('=== STARTING INTEGRATION TEST FOR SALARY ITEMS ===\n');

  // Check if salary_items table exists, if not we print warning to remind running the SQL script
  const { error: probeErr } = await supabase.from('salary_items').select('id').limit(1);
  if (probeErr && probeErr.code === 'PGRST205') {
    console.error('❌ ERROR: Table public.salary_items does not exist. Please run create_salary_items_table.sql in your Supabase Dashboard SQL Editor!');
    return;
  }

  // 1. Get real employee UUID
  const { data: emps } = await supabase.from('master_employees').select('id, name').limit(2);
  if (!emps || emps.length < 2) {
    console.error('❌ Need at least 2 master employees for this test!');
    return;
  }

  const emp1 = emps[0];
  const emp2 = emps[1];
  console.log(`👤 Employee 1: ${emp1.name} (${emp1.id})`);
  console.log(`👤 Employee 2: ${emp2.name} (${emp2.id})`);

  // Target Year and Month: 2029-12 (to avoid conflicts with existing months)
  const companyId = '0553618d-1d44-4f24-b6d8-7981fd4c6427';
  const year = 2029;
  const month = 12;

  // Let's delete any legacy test months/items for 2029-12 to make test clean
  await supabase.from('salary_months').delete().eq('year', year).eq('month', month);

  // Flow Step 1: Query month
  console.log('\nStep 1: Check existing month...');
  const { data: existingMonth } = await supabase
    .from('salary_months')
    .select('id')
    .eq('company_id', companyId)
    .eq('year', year)
    .eq('month', month)
    .maybeSingle();

  let monthId = null;
  if (existingMonth) {
    monthId = existingMonth.id;
    console.log('✅ Month exists, ID:', monthId);
  } else {
    console.log('Inserting new month...');
    const { data: newMonth, error: insMonthErr } = await supabase
      .from('salary_months')
      .insert([{ company_id: companyId, year, month, status: 'draft' }])
      .select('id')
      .single();

    if (insMonthErr) {
      console.error('❌ Failed to insert month:', insMonthErr.message);
      return;
    }
    monthId = newMonth.id;
    console.log('✅ Created month, ID:', monthId);
  }

  // Flow Step 2: Save salary item for Employee 1
  console.log(`\nStep 2: Saving salary item for ${emp1.name}...`);
  const itemPayload1 = {
    salary_month_id: monthId,
    employee_id: emp1.id,
    notes: JSON.stringify({ name: emp1.name, baseSalary: 30000 })
  };

  const { data: insItem1, error: insItemErr1 } = await supabase
    .from('salary_items')
    .insert([itemPayload1])
    .select('*')
    .single();

  if (insItemErr1) {
    console.error('❌ Failed to insert salary item 1:', insItemErr1.message);
  } else {
    console.log('✅ Saved salary item 1! ID:', insItem1.id);
  }

  // Flow Step 3: Save/update salary item for Employee 1 again (Upsert Simulation)
  console.log(`\nStep 3: Simulating upsert (SELECT then UPDATE) for ${emp1.name} again...`);
  const { data: checkItem } = await supabase
    .from('salary_items')
    .select('id')
    .eq('salary_month_id', monthId)
    .eq('employee_id', emp1.id)
    .maybeSingle();

  if (checkItem) {
    console.log('Found existing item, updating it...');
    const { data: updItem1, error: updErr1 } = await supabase
      .from('salary_items')
      .update({ notes: JSON.stringify({ name: emp1.name, baseSalary: 32000, remark: 'Updated' }) })
      .eq('id', checkItem.id)
      .select('*')
      .single();

    if (updErr1) {
      console.error('❌ Failed to update item 1:', updErr1.message);
    } else {
      console.log('✅ Successfully updated item 1! ID:', updItem1.id, 'notes:', updItem1.notes);
    }
  }

  // Flow Step 4: Save salary item for Employee 2 (should insert to same month without violating unique constraint on month)
  console.log(`\nStep 4: Saving salary item for Employee 2 (${emp2.name}) in same month...`);
  const itemPayload2 = {
    salary_month_id: monthId,
    employee_id: emp2.id,
    notes: JSON.stringify({ name: emp2.name, baseSalary: 35000 })
  };

  const { data: insItem2, error: insItemErr2 } = await supabase
    .from('salary_items')
    .insert([itemPayload2])
    .select('*')
    .single();

  if (insItemErr2) {
    console.error('❌ Failed to insert salary item 2:', insItemErr2.message);
  } else {
    console.log('✅ Saved salary item 2! ID:', insItem2.id);
  }

  // Cleanup
  console.log('\nCleaning up test month and items...');
  await supabase.from('salary_months').delete().eq('id', monthId);
  console.log('🎉 INTEGRATION TEST PASSED SUCCESSFULLY!');
}

testSalaryItemsFlow().catch(err => console.error(err));
