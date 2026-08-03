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

async function testAllInserts() {
  const { data: companies } = await supabase.from('companies').select('*').limit(1);
  const companyId = companies && companies[0] ? companies[0].id : null;
  console.log('Company ID:', companyId);

  const { data: stores } = await supabase.from('stores').select('*').limit(1);
  const storeId = stores && stores[0] ? stores[0].id : null;
  console.log('Store ID:', storeId);

  const testCases = [
    {
      table: 'master_employees',
      row: { name: 'Test Emp', company_id: companyId, store_id: storeId }
    },
    {
      table: 'salary_months',
      row: { month: '2026-08', company_id: companyId }
    },
    {
      table: 'schedule_weeks',
      row: { start_date: '2026-08-03', end_date: '2026-08-09' }
    },
    {
      table: 'stores',
      row: { store_name: 'Test Store', company_id: companyId }
    },
    {
      table: 'app_settings',
      row: { company_id: companyId }
    }
  ];

  for (const tc of testCases) {
    const { data, error } = await supabase.from(tc.table).insert([tc.row]).select('*');
    if (error) {
      console.log(`[${tc.table}] Insert ERROR: ${error.message}`);
    } else {
      console.log(`[${tc.table}] Insert SUCCESS! Created ID: ${data[0].id}`);
      await supabase.from(tc.table).delete().eq('id', data[0].id);
    }
  }
}

testAllInserts().catch(err => console.error(err));
