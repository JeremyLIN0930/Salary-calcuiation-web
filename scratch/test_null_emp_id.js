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

async function testNullEmpId() {
  console.log('=== TESTING NULL EMPLOYEE_ID INSERT ===\n');

  const { data: weekRow } = await supabase.from('schedule_weeks').select('id').limit(1);
  if (!weekRow || weekRow.length === 0) return;

  const testWeekId = weekRow[0].id;
  const { data, error } = await supabase
    .from('schedule_shifts')
    .insert([{
      schedule_week_id: testWeekId,
      employee_id: null,
      work_date: '2026-08-04',
      shift_type: 'work',
      remarks: '[temp: 臨時工小明]'
    }])
    .select('*');

  if (error) {
    console.error('❌ Insert with employee_id = null failed:', error.message);
  } else {
    console.log('✅ SUCCESS! employee_id = null is ALLOWED in PostgreSQL! Inserted row:', data);
    // Cleanup
    if (data && data[0]) {
      await supabase.from('schedule_shifts').delete().eq('id', data[0].id);
      console.log('Cleaned up test row.');
    }
  }
}

testNullEmpId().catch(err => console.error(err));
