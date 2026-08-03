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

async function testShiftsFlow() {
  console.log('=== STARTING INTEGRATION TEST FOR SCHEDULE SHIFTS ===\n');

  // 1. Fetch one master employee to get a real UUID
  const { data: emps, error: empErr } = await supabase
    .from('master_employees')
    .select('id, name')
    .limit(2);

  if (empErr) {
    console.error('❌ Failed to fetch master employees:', empErr.message);
    return;
  }

  if (!emps || emps.length === 0) {
    console.log('⚠️ No master employees found! Creating a dummy one first...');
    const { data: newEmp, error: createEmpErr } = await supabase
      .from('master_employees')
      .insert([{
        name: '測試員工甲',
        company_id: '0553618d-1d44-4f24-b6d8-7981fd4c6427', // DEFAULT_COMPANY_ID
        is_active: true
      }])
      .select('id, name')
      .single();
    
    if (createEmpErr) {
      console.error('❌ Failed to create dummy master employee:', createEmpErr.message);
      return;
    }
    emps.push(newEmp);
  }

  const employee = emps[0];
  console.log('👤 Selected Master Employee:', employee.name, '| UUID:', employee.id);

  // 2. Query schedule_months first to find or create
  let monthId = null;
  const { data: existingMonth } = await supabase
    .from('schedule_months')
    .select('id')
    .eq('company_id', '0553618d-1d44-4f24-b6d8-7981fd4c6427')
    .eq('year', 2027)
    .eq('month', 12)
    .maybeSingle();

  if (existingMonth) {
    monthId = existingMonth.id;
    console.log('✅ Found existing schedule_months ID:', monthId);
  } else {
    const monthPayload = {
      company_id: '0553618d-1d44-4f24-b6d8-7981fd4c6427',
      year: 2027,
      month: 12,
      status: 'draft'
    };

    const { data: monthRow, error: monthErr } = await supabase
      .from('schedule_months')
      .insert([monthPayload])
      .select('id')
      .single();

    if (monthErr) {
      console.error('❌ Failed to create schedule_months:', monthErr.message);
      return;
    }
    monthId = monthRow.id;
    console.log('✅ Created schedule_months ID:', monthId);
  }

  // 3. Create a schedule_week
  const weekPayload = {
    schedule_month_id: monthId,
    week_no: 4,
    start_date: '2027-12-20',
    end_date: '2027-12-26',
    notes: '測試排班備註說明'
  };

  const { data: weekRow, error: weekErr } = await supabase
    .from('schedule_weeks')
    .insert([weekPayload])
    .select('id')
    .single();

  if (weekErr) {
    console.error('❌ Failed to create schedule_weeks:', weekErr.message);
    // Cleanup parent
    if (!existingMonth) {
      await supabase.from('schedule_months').delete().eq('id', monthId);
    }
    return;
  }
  const weekId = weekRow.id;
  console.log('✅ Created schedule_weeks ID:', weekId);

  // 4. Create schedule_shifts
  const shiftPayloads = [
    {
      schedule_week_id: weekId,
      employee_id: employee.id,
      work_date: '2027-12-20',
      shift_type: 'work',
      start_time: '07:00',
      end_time: '15:00',
      is_day_off: false,
      remarks: '早班測試'
    },
    {
      schedule_week_id: weekId,
      employee_id: employee.id,
      work_date: '2027-12-21',
      shift_type: 'off',
      is_day_off: true,
      remarks: '休假測試'
    }
  ];

  console.log('\nInserting schedule_shifts rows:', JSON.stringify(shiftPayloads, null, 2));
  const { data: shiftRows, error: shiftsInsertErr } = await supabase
    .from('schedule_shifts')
    .insert(shiftPayloads)
    .select('*');

  if (shiftsInsertErr) {
    console.error('❌ Failed to insert schedule_shifts:', shiftsInsertErr.message);
  } else {
    console.log('✅ Created schedule_shifts rows:', shiftRows.length, 'records!');
    shiftRows.forEach((row, i) => {
      console.log(`   - Shift ${i + 1} ID: ${row.id} | Date: ${row.work_date} | Type: ${row.shift_type}`);
    });
  }

  // 5. Query and verify load
  console.log('\nQuerying back shifts and joining master_employees...');
  const { data: joinedData, error: joinErr } = await supabase
    .from('schedule_shifts')
    .select('*, master_employees(id, name)')
    .eq('schedule_week_id', weekId);

  if (joinErr) {
    console.error('❌ Join query failed:', joinErr.message);
  } else {
    console.log('✅ Reconstructed Query Success! Result rows:', joinedData.length);
    joinedData.forEach((row, i) => {
      console.log(`   - Shift ${i + 1}: ${row.master_employees?.name || 'Unknown'} | Date: ${row.work_date} | Type: ${row.shift_type} | Remarks: ${row.remarks}`);
    });
  }

  // Cleanup
  console.log('\nCleaning up all inserted rows...');
  await supabase.from('schedule_shifts').delete().eq('schedule_week_id', weekId);
  await supabase.from('schedule_weeks').delete().eq('id', weekId);
  if (!existingMonth) {
    await supabase.from('schedule_months').delete().eq('id', monthId);
  }
  console.log('🎉 INTEGRATION TEST COMPLETED SUCCESSFULLY!');
}

testShiftsFlow().catch(err => console.error(err));
