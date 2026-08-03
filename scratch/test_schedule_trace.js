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

async function testSchedulePersistence() {
  console.log('=== SCHEDULE PERSISTENCE & SUPABASE TEST ===\n');

  const scheduleModel = {
    storeId: 'b357ddf1-7024-4a0a-8aa0-66c62214dbeb',
    storeName: '慶東門市',
    weekStart: '2026-08-03',
    weekEnd: '2026-08-09',
    employees: [
      {
        id: 'emp-001',
        name: '張偉強',
        shifts: [
          { date: '2026-08-03', shiftCode: '早班', startTime: '07:00', endTime: '15:00' },
          { date: '2026-08-04', shiftCode: '晚班', startTime: '15:00', endTime: '23:00' }
        ]
      }
    ],
    remark: '8月第一週測試排班表',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const payload = {
    start_date: scheduleModel.weekStart,
    end_date: scheduleModel.weekEnd,
    notes: JSON.stringify(scheduleModel),
    updated_at: scheduleModel.updatedAt
  };

  console.log('Schedule INSERT Payload', payload);

  const { data, error } = await supabase.from('schedule_weeks').insert([payload]).select('*').single();

  if (error) {
    console.error('❌ Schedule Save Error:', error.code, error.message);
  } else {
    console.log('✅ Schedule Save SUCCESS! Row ID:', data.id);
    console.log('✅ Returned Row start_date:', data.start_date, 'end_date:', data.end_date);

    // Verify Read back
    const { data: selectRow, error: selectErr } = await supabase.from('schedule_weeks').select('*').eq('id', data.id).single();
    if (selectRow) {
      const restored = JSON.parse(selectRow.notes);
      console.log('✅ SELECT after INSERT Verified! Store:', restored.storeName, '| Employees count:', restored.employees.length);
      console.log('✅ Restored Shift:', restored.employees[0].shifts[0]);
    }

    // Clean up
    await supabase.from('schedule_weeks').delete().eq('id', data.id);
    console.log('Cleaned up test row.');
  }
}

testSchedulePersistence().catch(err => console.error(err));
