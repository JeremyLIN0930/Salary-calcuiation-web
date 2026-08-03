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

async function testScheduleMonthFkFlow() {
  console.log('=== TESTING SCHEDULE MONTH PARENT FK FLOW ===\n');

  const companyId = '0553618d-1d44-4f24-b6d8-7981fd4c6427';
  const yearVal = 2026;
  const monthNum = 8;

  // 1. Query existing schedule_months
  let { data: monthRow } = await supabase
    .from('schedule_months')
    .select('id')
    .eq('company_id', companyId)
    .eq('year', yearVal)
    .eq('month', monthNum)
    .maybeSingle();

  if (!monthRow) {
    console.log('Inserting parent schedule_months row...');
    const { data: newMonth, error: monthErr } = await supabase
      .from('schedule_months')
      .insert([{
        company_id: companyId,
        year: yearVal,
        month: monthNum,
        status: 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select('id')
      .single();

    if (monthErr) {
      console.error('❌ schedule_months Insert Failed:', monthErr.code, monthErr.message);
      return;
    }
    monthRow = newMonth;
    console.log('✅ Created schedule_months ID:', monthRow.id);
  } else {
    console.log('✅ Found existing schedule_months ID:', monthRow.id);
  }

  // 2. Insert schedule_weeks using schedule_month_id
  const weekPayload = {
    schedule_month_id: monthRow.id,
    start_date: '2026-08-03',
    end_date: '2026-08-09',
    notes: JSON.stringify({ weekStart: '2026-08-03', weekEnd: '2026-08-09', employees: [{ name: '張偉強' }] }),
    updated_at: new Date().toISOString()
  };

  console.log('\nInserting schedule_weeks with schedule_month_id:', weekPayload);

  const { data: weekRow, error: weekErr } = await supabase
    .from('schedule_weeks')
    .insert([weekPayload])
    .select('*')
    .single();

  if (weekErr) {
    console.error('❌ schedule_weeks Insert Failed:', weekErr.code, weekErr.message);
  } else {
    console.log('🎉 schedule_weeks Insert SUCCESS! Row ID:', weekRow.id);
    console.log('✅ schedule_month_id in DB:', weekRow.schedule_month_id);

    // Cleanup
    await supabase.from('schedule_weeks').delete().eq('id', weekRow.id);
    await supabase.from('schedule_months').delete().eq('id', monthRow.id);
    console.log('Cleaned up test rows.');
  }
}

testScheduleMonthFkFlow().catch(err => console.error(err));
