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

async function testTempEmployeeFlow() {
  console.log('=== TESTING TEMPORARY EMPLOYEE SCHEDULE FLOW ===\n');

  // 1. Get initial master_employees count
  const { data: initMaster } = await supabase.from('master_employees').select('id');
  const initCount = initMaster?.length || 0;
  console.log('Initial master_employees count:', initCount);

  // 2. Fetch a week
  const { data: weeks } = await supabase.from('schedule_weeks').select('id').limit(1);
  if (!weeks || weeks.length === 0) return;
  const weekId = weeks[0].id;

  // 3. Test shift insert for temporary worker (employee_id = null)
  const tempName = '臨時工小明_' + Math.floor(Math.random() * 1000);
  console.log('Simulating schedule save for temp worker:', tempName);

  // Try direct insert with employee_id = null or fallback
  const { data: insShift, error: insErr } = await supabase
    .from('schedule_shifts')
    .insert([{
      schedule_week_id: weekId,
      employee_id: null,
      employee_name: tempName,
      work_date: '2026-08-04',
      shift_type: 'work',
      remarks: `[temp:${tempName}]`
    }])
    .select('*');

  let testShiftId = null;
  if (insErr) {
    console.log('Direct insert with employee_id = null:', insErr.message);
    // Fallback: auto-create temp master entry
    const { data: tempMaster } = await supabase.from('master_employees').insert([{
      name: tempName,
      company_id: '0553618d-1d44-4f24-b6d8-7981fd4c6427',
      store_id: 'b357ddf1-7024-4a0a-8aa0-66c62214dbeb',
      hire_date: '2026-08-04',
      notes: '[temp]'
    }]).select('id').single();

    if (tempMaster) {
      console.log('Fallback temp master created with ID:', tempMaster.id);
      const { data: fbShift } = await supabase.from('schedule_shifts').insert([{
        schedule_week_id: weekId,
        employee_id: tempMaster.id,
        work_date: '2026-08-04',
        shift_type: 'work',
        remarks: `[temp:${tempName}]`
      }]).select('*').single();
      if (fbShift) testShiftId = fbShift.id;
    }
  } else {
    console.log('✅ Direct insert with employee_id = NULL & employee_name SUCCESS! Row:', insShift[0]);
    testShiftId = insShift[0].id;
  }

  // 4. Verify master_employees count
  const { data: afterMaster } = await supabase.from('master_employees').select('id');
  console.log('After temp worker save master_employees count:', afterMaster?.length || 0);

  // Clean up
  if (testShiftId) {
    await supabase.from('schedule_shifts').delete().eq('id', testShiftId);
    console.log('Cleaned up test shift.');
  }

  console.log('\n🎉 TEMPORARY EMPLOYEE FLOW TEST COMPLETE!');
}

testTempEmployeeFlow().catch(err => console.error(err));
