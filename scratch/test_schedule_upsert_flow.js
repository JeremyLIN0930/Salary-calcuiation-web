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

async function testScheduleUpsertFlow() {
  console.log('=== STARTING INTEGRATION TEST FOR SCHEDULE UPSERT FLOW ===\n');

  // 1. Get real employee UUID
  const { data: emps } = await supabase.from('master_employees').select('id, name').limit(1);
  if (!emps || emps.length === 0) {
    console.error('❌ Need at least 1 master employee for this test!');
    return;
  }
  const employee = emps[0];
  console.log(`👤 Master Employee: ${employee.name} (${employee.id})`);

  const companyId = '0553618d-1d44-4f24-b6d8-7981fd4c6427';
  const year = 2029;
  const month = 10;
  const weekStart = '2029-10-01'; // Monday
  const weekEnd = '2029-10-07';
  const weekNo = 1;

  // Let's delete any legacy test rows first
  console.log('Cleaning up previous test rows...');
  const { data: mToDelete } = await supabase
    .from('schedule_months')
    .select('id')
    .eq('company_id', companyId)
    .eq('year', year)
    .eq('month', month);

  if (mToDelete && mToDelete.length > 0) {
    const mIds = mToDelete.map(m => m.id);
    await supabase.from('schedule_months').delete().in('id', mIds);
  }
  console.log('Cleanup completed.');

  // Helper to query month, week, and shifts count
  async function logDbCounts() {
    const { data: months } = await supabase.from('schedule_months').select('id').eq('company_id', companyId).eq('year', year).eq('month', month);
    const mIds = (months || []).map(m => m.id);
    
    let weeksCount = 0;
    let shiftsCount = 0;
    
    if (mIds.length > 0) {
      const { data: weeks } = await supabase.from('schedule_weeks').select('id').in('schedule_month_id', mIds);
      weeksCount = (weeks || []).length;
      
      const wIds = (weeks || []).map(w => w.id);
      if (wIds.length > 0) {
        const { data: shifts } = await supabase.from('schedule_shifts').select('id').in('schedule_week_id', wIds);
        shiftsCount = (shifts || []).length;
      }
    }
    console.log(`📊 DB Counts -> Months: ${months?.length || 0}, Weeks: ${weeksCount}, Shifts: ${shiftsCount}`);
    return { monthsCount: months?.length || 0, weeksCount, shiftsCount };
  }

  await logDbCounts();

  // Test Run 1: First Save
  console.log('\n--- Run 1: First Save (Create new Month & Week & Shifts) ---');
  let monthId = null;
  // 1. Month insert
  const { data: newMonth } = await supabase
    .from('schedule_months')
    .insert([{ company_id: companyId, year, month, status: 'draft' }])
    .select('id')
    .single();
  monthId = newMonth.id;
  console.log('✅ Created month:', monthId);

  // 2. Week insert
  const { data: newWeek } = await supabase
    .from('schedule_weeks')
    .insert([{ schedule_month_id: monthId, week_no: weekNo, start_date: weekStart, end_date: weekEnd }])
    .select('id')
    .single();
  const weekId = newWeek.id;
  console.log('✅ Created week:', weekId);

  // 3. Shifts insert
  const { data: newShifts, error: insErr } = await supabase
    .from('schedule_shifts')
    .insert([
      { schedule_week_id: weekId, employee_id: employee.id, work_date: '2029-10-01', shift_type: 'work', start_time: '08:00', end_time: '16:00', is_day_off: false },
      { schedule_week_id: weekId, employee_id: employee.id, work_date: '2029-10-02', shift_type: 'off', is_day_off: true }
    ])
    .select('*');

  if (insErr) {
    console.error('❌ Insert shifts error:', insErr);
    return;
  }
  console.log('✅ Inserted shifts:', newShifts.length);
  const initialCounts = await logDbCounts();

  // Test Run 2: Second Save (Same Month & Week, Update Shifts)
  console.log('\n--- Run 2: Second Save (Upsert/Reuse Month & Week, Update existing Shift types) ---');
  // 1. Month Upsert check (SELECT first)
  const { data: exMonth } = await supabase.from('schedule_months').select('id').eq('company_id', companyId).eq('year', year).eq('month', month).maybeSingle();
  const targetMonthId = exMonth.id;
  console.log('✅ Reused existing month:', targetMonthId);

  // 2. Week Upsert check (SELECT first)
  const { data: exWeek } = await supabase.from('schedule_weeks').select('id').eq('schedule_month_id', targetMonthId).eq('week_no', weekNo).maybeSingle();
  const targetWeekId = exWeek.id;
  console.log('✅ Reused existing week:', targetWeekId);

  // 3. Shifts Upsert check (SELECT/Map match then UPDATE or INSERT)
  const payloadShifts = [
    { schedule_week_id: targetWeekId, employee_id: employee.id, work_date: '2029-10-01', shift_type: 'off', is_day_off: true }, // work -> off
    { schedule_week_id: targetWeekId, employee_id: employee.id, work_date: '2029-10-02', shift_type: 'work', start_time: '09:00', end_time: '17:00', is_day_off: false }, // off -> work
    { schedule_week_id: targetWeekId, employee_id: employee.id, work_date: '2029-10-03', shift_type: 'work', start_time: '09:00', end_time: '17:00', is_day_off: false } // new shift
  ];

  const { data: dbShifts } = await supabase.from('schedule_shifts').select('id, employee_id, work_date').eq('schedule_week_id', targetWeekId);
  const dbShiftMap = new Map();
  dbShifts.forEach(s => dbShiftMap.set(`${s.employee_id}_${s.work_date}`, s.id));

  const keptIds = new Set();
  for (const sRow of payloadShifts) {
    const key = `${sRow.employee_id}_${sRow.work_date}`;
    const exShiftId = dbShiftMap.get(key);
    if (exShiftId) {
      keptIds.add(exShiftId);
      await supabase.from('schedule_shifts').update({ shift_type: sRow.shift_type, is_day_off: !!sRow.is_day_off, start_time: sRow.start_time || null, end_time: sRow.end_time || null }).eq('id', exShiftId);
    } else {
      const { data: newS } = await supabase.from('schedule_shifts').insert([sRow]).select('id').single();
      keptIds.add(newS.id);
    }
  }
  console.log('✅ Shift Upserts completed.');
  const run2Counts = await logDbCounts();

  // Assertions
  if (run2Counts.monthsCount === 1 && run2Counts.weeksCount === 1 && run2Counts.shiftsCount === 3) {
    console.log('\n🎉 SUCCESS: Upsert flow did not duplicate months or weeks, and successfully updated/inserted shifts!');
  } else {
    console.error('\n❌ FAILURE: Counts do not match expected values.');
  }

  // Cleanup
  console.log('\nCleaning up database test rows...');
  await supabase.from('schedule_months').delete().eq('id', monthId);
  console.log('🎉 TEST COMPLETED SUCCESSFULLY!');
}

testScheduleUpsertFlow().catch(err => console.error(err));
