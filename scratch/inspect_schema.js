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

// Check if app_settings or schedule_weeks has json payload columns
const extraCandidates = [
  'key', 'value', 'setting_key', 'setting_value', 'settings', 'config', 'payload', 'data', 'content', 'json_data', 'details', 'records', 'items', 'store', 'remark', 'month_id', 'week_id', 'schedule_id', 'date', 'shift_date', 'day'
];

async function checkAppSettings() {
  const t = 'app_settings';
  const results = await Promise.all(
    extraCandidates.map(async col => {
      const { error } = await supabase.from(t).select(col).limit(1);
      return error ? null : col;
    })
  );
  console.log('app_settings extra cols:', results.filter(Boolean));
}

checkAppSettings();
