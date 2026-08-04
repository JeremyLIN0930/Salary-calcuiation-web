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

async function checkAndAlterShiftsTable() {
  console.log('=== INSPECTING SCHEDULE_SHIFTS TABLE ===\n');

  // 1. Fetch sample row from schedule_shifts
  const { data, error } = await supabase.from('schedule_shifts').select('*').limit(1);

  if (error) {
    console.error('Error selecting schedule_shifts:', error);
    return;
  }

  console.log('Sample row:', data);
  if (data && data.length > 0) {
    console.log('Existing columns:', Object.keys(data[0]));
  }

  // 2. Test inserting a row with employee_id = null and employee_name
  const { data: weekRow } = await supabase.from('schedule_weeks').select('id').limit(1);
  if (!weekRow || weekRow.length === 0) {
    console.log('No schedule_weeks row found for test.');
    return;
  }

  const testWeekId = weekRow[0].id;
  console.log('\nTesting insert with employee_id = null, employee_name = "臨時工測試"...');

  const { data: insData, error: insError } = await supabase
    .from('schedule_shifts')
    .insert([{
      schedule_week_id: testWeekId,
      employee_id: null,
      employee_name: '臨時工測試',
      work_date: '2026-08-04',
      shift_type: 'work',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }])
    .select('*');

  if (insError) {
    console.error('❌ Insert with null employee_id / employee_name failed:', insError.message);
  } else {
    console.log('✅ Insert SUCCESS! Row:', insData);
    // Delete test row
    if (insData && insData[0]) {
      await supabase.from('schedule_shifts').delete().eq('id', insData[0].id);
      console.log('Cleaned up test row.');
    }
  }
}

checkAndAlterShiftsTable().catch(err => console.error(err));
