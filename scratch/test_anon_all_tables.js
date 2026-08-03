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

const tables = [
  'master_employees',
  'salary_months',
  'salary_item_types',
  'schedule_months',
  'schedule_weeks',
  'schedule_shifts',
  'stores',
  'app_settings'
];

async function checkAnonAccessAllTables() {
  console.log('=== CHECKING ANON ROLE ACCESS FOR ALL 8 TABLES ===\n');

  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`❌ Table [${table}]: SELECT Failed ->`, error.code, error.message);
    } else {
      console.log(`✅ Table [${table}]: SELECT OK -> ${data.length} row(s) returned`);
    }
  }
}

checkAnonAccessAllTables().catch(err => console.error(err));
