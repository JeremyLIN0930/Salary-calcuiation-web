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

async function probe() {
  console.log('Probing schedule_shifts schema...');
  // Let's try select * limit 1 first
  const { data, error } = await supabase.from('schedule_shifts').select('*').limit(1);
  if (error) {
    console.error('Error selecting *:', error);
  } else {
    console.log('Row data keys:', data.length > 0 ? Object.keys(data[0]) : 'No data in table');
  }

  // Let's check some common columns by trying to select them
  const columns = [
    'id', 'schedule_week_id', 'employee_id', 'work_date', 'shift_type', 
    'start_time', 'end_time', 'is_day_off', 'remarks', 'created_at', 'updated_at'
  ];

  for (const col of columns) {
    const { error: colErr } = await supabase.from('schedule_shifts').select(col).limit(1);
    console.log(`Column '${col}':`, colErr ? `❌ ${colErr.message}` : '✅ OK');
  }
}

probe();
