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

async function testWeekNoInsert() {
  console.log('=== TESTING WEEK_NO INSERT INTO SCHEDULE_WEEKS ===\n');

  const companyId = '0553618d-1d44-4f24-b6d8-7981fd4c6427';
  const yearVal = 2026;
  const monthNum = 8;
  const startDateStr = '2026-08-03';
  const endDateStr = '2026-08-09';
  const weekNo = calcWeekNo(startDateStr);

  console.log(`Calculated week_no for ${startDateStr}: ${weekNo}`);

  // 1. Get or Create schedule_months
  let { data: monthRow } = await supabase
    .from('schedule_months')
    .select('id')
    .eq('company_id', companyId)
    .eq('year', yearVal)
    .eq('month', monthNum)
    .maybeSingle();

  if (!monthRow) {
    const { data: newMonth, error: monthErr } = await supabase
      .from('schedule_months')
      .insert([{ company_id: companyId, year: yearVal, month: monthNum, status: 'draft' }])
      .select('id')
      .single();

    if (monthErr) {
      console.error('❌ schedule_months insert failed:', monthErr.message);
      return;
    }
    monthRow = newMonth;
  }

  // 2. Insert schedule_weeks with week_no
  const weekPayload = {
    schedule_month_id: monthRow.id,
    week_no: weekNo,
    start_date: startDateStr,
    end_date: endDateStr,
    notes: JSON.stringify({ weekStart: startDateStr, weekEnd: endDateStr, employees: [] }),
    updated_at: new Date().toISOString()
  };

  console.log('Inserting schedule_weeks with week_no:', weekPayload);

  const { data: weekRow, error: weekErr } = await supabase
    .from('schedule_weeks')
    .insert([weekPayload])
    .select('*')
    .single();

  if (weekErr) {
    console.error('❌ schedule_weeks Insert Failed:', weekErr.code, weekErr.message);
  } else {
    console.log('🎉 schedule_weeks Insert SUCCESS! Row ID:', weekRow.id, 'week_no:', weekRow.week_no);

    // Cleanup
    await supabase.from('schedule_weeks').delete().eq('id', weekRow.id);
    await supabase.from('schedule_months').delete().eq('id', monthRow.id);
    console.log('Cleaned up test rows.');
  }
}

testWeekNoInsert().catch(err => console.error(err));
