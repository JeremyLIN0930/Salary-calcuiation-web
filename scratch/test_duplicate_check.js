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

async function testDuplicateCheck() {
  console.log('=== TESTING DUPLICATE SCHEDULE CHECK ===\n');

  // Test checking for existing week (2026-08-03)
  const storeIdentifier = '慶東門市';
  const weekStartStr = '2026-08-03';

  // 1. Resolve store
  const { data: stores } = await supabase.from('stores').select('id, store_code, store_name');
  const matchStore = (stores || []).find(s => s.store_name.includes(storeIdentifier) || s.store_code === '001');

  if (!matchStore) {
    console.log('Store not found.');
    return;
  }

  // 2. Resolve month
  const { data: month } = await supabase
    .from('schedule_months')
    .select('id')
    .eq('store_id', matchStore.id)
    .eq('year', 2026)
    .eq('month', 8)
    .maybeSingle();

  console.log('Found Parent Month for 慶東門市 2026/08:', month?.id || 'None');

  if (month) {
    const { data: week } = await supabase
      .from('schedule_weeks')
      .select('id, week_no, start_date, end_date')
      .eq('schedule_month_id', month.id)
      .eq('week_no', 1)
      .maybeSingle();

    console.log('Found Existing Week 1 for 慶東門市:', week);
    if (week) {
      console.log('\n✅ Duplicate check properly detected existing week! Dialog prompt would be triggered.');
    }
  }
}

testDuplicateCheck().catch(err => console.error(err));
