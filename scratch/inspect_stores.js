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

async function inspectStores() {
  console.log('=== INSPECTING STORES & SCHEDULE_MONTHS ===');

  const { data: stores, error: err1 } = await supabase.from('stores').select('*').limit(2);
  console.log('Stores sample:', { data: stores, error: err1 });

  const { data: months, error: err2 } = await supabase.from('schedule_months').select('*').limit(2);
  console.log('schedule_months sample:', { data: months, error: err2 });
}

inspectStores();
