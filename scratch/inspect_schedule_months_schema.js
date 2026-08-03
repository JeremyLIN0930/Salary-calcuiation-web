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

async function inspectScheduleSchemas() {
  console.log('=== INSPECTING SCHEDULE SCHEMAS ROUND 2 ===\n');

  // Test schedule_months insert without store_id
  const monthPayload = {
    company_id: '0553618d-1d44-4f24-b6d8-7981fd4c6427',
    year: 2026,
    month: 8,
    status: 'draft',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  console.log('Testing schedule_months insert:', monthPayload);
  const { data: insertedMonth, error: insMonthErr } = await supabase.from('schedule_months').insert([monthPayload]).select('*').single();
  console.log('schedule_months insert result:', { data: insertedMonth, error: insMonthErr });

  if (insertedMonth?.id) {
    console.log('✅ schedule_months columns:', Object.keys(insertedMonth));

    const weekPayload = {
      schedule_month_id: insertedMonth.id,
      start_date: '2026-08-03',
      end_date: '2026-08-09',
      notes: 'Test Week Notes',
      updated_at: new Date().toISOString()
    };
    console.log('\nTesting schedule_weeks insert:', weekPayload);
    const { data: insertedWeek, error: insWeekErr } = await supabase.from('schedule_weeks').insert([weekPayload]).select('*').single();
    console.log('schedule_weeks insert result:', { data: insertedWeek, error: insWeekErr });

    if (insertedWeek?.id) {
      console.log('✅ schedule_weeks columns:', Object.keys(insertedWeek));
      await supabase.from('schedule_weeks').delete().eq('id', insertedWeek.id);
    }
    await supabase.from('schedule_months').delete().eq('id', insertedMonth.id);
    console.log('\nCleaned up test rows successfully!');
  }
}

inspectScheduleSchemas().catch(err => console.error(err));
