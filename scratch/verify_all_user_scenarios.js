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

function isValidUuid(str) {
  if (!str || typeof str !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

async function runComprehensiveVerification() {
  console.log('====================================================');
  console.log('  COMPREHENSIVE REFACTOR SIMULATION TEST');
  console.log('====================================================\n');

  // Step 1: Get sample week
  const { data: weeks } = await supabase.from('schedule_weeks').select('id').limit(1);
  if (!weeks || weeks.length === 0) return;
  const weekId = weeks[0].id;

  const tempName = '林玟妏';
  console.log(`1. Testing 4 shifts for temporary worker: "${tempName}" on week ${weekId}...`);

  // Simulate saveSchedule for Temporary Worker "林玟妏"
  const shiftDates = ['2026-08-03', '2026-08-04', '2026-08-05', '2026-08-06'];
  const testShifts = shiftDates.map((date, idx) => ({
    schedule_week_id: weekId,
    employee_id: null,
    employee_name: tempName,
    work_date: date,
    shift_type: idx === 3 ? 'off' : 'work',
    start_time: idx === 3 ? null : '07:00:00',
    end_time: idx === 3 ? null : '15:00:00',
    remarks: idx === 2 ? '點貨' : null
  }));

  // Perform save Schedule with Fallback
  const createdShiftIds = [];
  const createdTempMasterIds = [];

  for (const shiftRow of testShifts) {
    const { data: insData, error: insErr } = await supabase
      .from('schedule_shifts')
      .insert([shiftRow])
      .select('id')
      .single();

    if (insErr) {
      // Fallback for live Supabase DB before SQL script is run
      const tempRemark = `[temp:${shiftRow.employee_name}]`;
      const { data: tempMaster } = await supabase
        .from('master_employees')
        .insert([{
          name: shiftRow.employee_name,
          company_id: '0553618d-1d44-4f24-b6d8-7981fd4c6427',
          store_id: 'b357ddf1-7024-4a0a-8aa0-66c62214dbeb',
          hire_date: '2026-08-04',
          is_active: true,
          notes: '[temp]'
        }])
        .select('id')
        .single();

      if (tempMaster?.id) {
        createdTempMasterIds.push(tempMaster.id);
        const fallbackRow = { ...shiftRow, employee_id: tempMaster.id, remarks: tempRemark };
        delete fallbackRow.employee_name;
        const { data: retryData } = await supabase.from('schedule_shifts').insert([fallbackRow]).select('id').single();
        if (retryData) createdShiftIds.push(retryData.id);
      }
    } else if (insData) {
      createdShiftIds.push(insData.id);
    }
  }

  console.log(`✅ Saved ${createdShiftIds.length} shifts for "${tempName}".`);

  // Step 2: Test populateSchedulesWithShifts Grouping
  const { data: fetchedShifts } = await supabase
    .from('schedule_shifts')
    .select('*')
    .eq('schedule_week_id', weekId);

  const { data: masterEmps } = await supabase.from('master_employees').select('id, name, notes');
  const empMap = new Map();
  masterEmps?.forEach(m => empMap.set(m.id, m.name));

  const empShiftsMap = new Map();
  fetchedShifts?.forEach(s => {
    let empKey = s.employee_id;
    let isTemp = false;
    let empName = '';

    if (s.employee_id && isValidUuid(s.employee_id)) {
      empKey = s.employee_id;
      empName = empMap.get(s.employee_id) || s.employee_name || '未命名員工';
      // If employee was a fallback temp master, resolve name cleanly
      if (s.remarks && s.remarks.startsWith('[temp:')) {
        empName = s.remarks.slice(6, -1).trim();
        empKey = `temp_${empName}`;
        isTemp = true;
      }
    } else {
      empName = s.employee_name || (s.remarks && s.remarks.startsWith('[temp:') ? s.remarks.slice(6, -1).trim() : '臨時工');
      empKey = `temp_${empName}`;
      isTemp = true;
    }

    if (!empShiftsMap.has(empKey)) {
      empShiftsMap.set(empKey, { name: empName, isTemp, dateMap: new Map() });
    }
    empShiftsMap.get(empKey).dateMap.set(s.work_date, s);
  });

  console.log('\n2. Grouping Results in populateSchedulesWithShifts():');
  empShiftsMap.forEach((val, key) => {
    if (val.name.includes('林玟妏')) {
      console.log(`   👉 Key: "${key}" | Employee Name: "${val.name}" | IsTemp: ${val.isTemp} | Dates count: ${val.dateMap.size}`);
    }
  });

  let tempEntry = empShiftsMap.get(`temp_${tempName}`);
  if (tempEntry && tempEntry.dateMap.size === 4) {
    console.log(`\n🎉 SUCCESS! "${tempName}" with 4 shifts is grouped into EXACTLY 1 ROW (1 ScheduleEmployee)!`);
  } else {
    console.log(`\nResults for "${tempName}":`, tempEntry);
  }

  // Cleanup
  if (createdShiftIds.length > 0) {
    await supabase.from('schedule_shifts').delete().in('id', createdShiftIds);
  }
  if (createdTempMasterIds.length > 0) {
    await supabase.from('master_employees').delete().in('id', createdTempMasterIds);
  }

  console.log('\n====================================================');
  console.log('  VERIFICATION COMPLETE');
  console.log('====================================================');
}

runComprehensiveVerification().catch(err => console.error(err));
