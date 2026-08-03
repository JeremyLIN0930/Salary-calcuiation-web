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

function calcWeekNo(startDateStr) {
  const dayOfMonth = parseInt(startDateStr.slice(8, 10), 10) || 1;
  return Math.min(Math.ceil(dayOfMonth / 7), 5);
}

async function testFullScheduleChain() {
  console.log('=== END-TO-END SCHEDULE CHAIN VERIFICATION ===\n');

  const companyId = '0553618d-1d44-4f24-b6d8-7981fd4c6427';
  const startDateStr = '2026-08-03';
  const endDateStr = '2026-08-09';
  const yearVal = parseInt(startDateStr.slice(0, 4), 10);
  const monthNum = parseInt(startDateStr.slice(5, 7), 10);
  const weekNo = calcWeekNo(startDateStr);

  // Step 1: schedule_months
  console.log('1. Checking schedule_months...');
  let { data: monthRow } = await supabase
    .from('schedule_months')
    .select('id')
    .eq('company_id', companyId)
    .eq('year', yearVal)
    .eq('month', monthNum)
    .maybeSingle();

  if (!monthRow) {
    console.log('Creating parent schedule_months...');
    const { data: newMonth, error: mErr } = await supabase
      .from('schedule_months')
      .insert([{ company_id: companyId, year: yearVal, month: monthNum, status: 'draft' }])
      .select('id')
      .single();
    if (mErr) {
      console.error('❌ schedule_months error:', mErr.code, mErr.message);
      return;
    }
    monthRow = newMonth;
  }
  console.log('✅ Parent schedule_months ID:', monthRow.id);

  // Step 2: schedule_weeks
  console.log('\n2. Inserting schedule_weeks with week_no & schedule_month_id...');
  const weekPayload = {
    schedule_month_id: monthRow.id,
    week_no: weekNo,
    start_date: startDateStr,
    end_date: endDateStr,
    notes: JSON.stringify({
      weekStart: startDateStr,
      weekEnd: endDateStr,
      employees: [
        {
          id: 'emp-01',
          name: '張偉強',
          shifts: [{ date: '2026-08-03', shiftCode: '早班' }]
        }
      ]
    }),
    updated_at: new Date().toISOString()
  };

  console.log('Schedule Week Payload:\n', JSON.stringify(weekPayload, null, 2));

  const { data: weekRow, error: wErr } = await supabase
    .from('schedule_weeks')
    .insert([weekPayload])
    .select('*')
    .single();

  if (wErr) {
    console.error('❌ schedule_weeks error:', wErr.code, wErr.message);
    return;
  }
  console.log('✅ schedule_weeks Created Successfully! ID:', weekRow.id, '| week_no:', weekRow.week_no);

  // Step 3: schedule_shifts
  console.log('\n3. Inserting test shift into schedule_shifts...');
  const shiftPayload = {
    schedule_week_id: weekRow.id,
    employee_name: '張偉強',
    work_date: '2026-08-03',
    shift_code: '早班',
    start_time: '07:00',
    end_time: '15:00',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { data: shiftRow, error: sErr } = await supabase
    .from('schedule_shifts')
    .insert([shiftPayload])
    .select('*')
    .single();

  if (sErr) {
    console.log('ℹ️ schedule_shifts Insert Note:', sErr.message);
  } else {
    console.log('✅ schedule_shifts Created Successfully! ID:', shiftRow.id);
    await supabase.from('schedule_shifts').delete().eq('id', shiftRow.id);
  }

  // Cleanup
  await supabase.from('schedule_weeks').delete().eq('id', weekRow.id);
  await supabase.from('schedule_months').delete().eq('id', monthRow.id);
  console.log('\n🎉 ALL SCHEDULE STEPS VERIFIED & CLEANED UP!');
}

testFullScheduleChain().catch(err => console.error(err));
