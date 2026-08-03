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

async function testRepositoryLog() {
  console.log('=== VERIFYING schedule_weeks INSERT PAYLOAD LOG ===\n');

  const startDateStr = '2026-08-03';
  const endDateStr = '2026-08-09';
  const weekNo = calcWeekNo(startDateStr);
  const mockMonthId = '107c8d72-3188-46d7-81d8-72eae7402723';

  const dbRow = {
    schedule_month_id: mockMonthId,
    week_no: weekNo,
    start_date: startDateStr,
    end_date: endDateStr,
    notes: JSON.stringify({ weekStart: startDateStr, weekEnd: endDateStr, employees: [] }),
    updated_at: new Date().toISOString()
  };

  console.log('schedule_weeks INSERT', dbRow);

  console.log('\nPayload JSON format:');
  console.log(JSON.stringify(dbRow, null, 2));

  console.log('\n✅ Verification: week_no =', dbRow.week_no, '| Type:', typeof dbRow.week_no);
}

testRepositoryLog().catch(err => console.error(err));
