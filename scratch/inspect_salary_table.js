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

async function inspectSalaryMonths() {
  console.log('=== SALARY_MONTHS SCHEMA & INSERT TEST ===');

  // 1. Check existing row to inspect columns
  const { data: selectData, error: selectErr } = await supabase.from('salary_months').select('*').limit(1);
  console.log('Select Result:', { data: selectData, error: selectErr });

  if (selectData && selectData.length > 0) {
    console.log('Existing Columns in salary_months:', Object.keys(selectData[0]));
    console.log('Sample Row:', selectData[0]);
  }

  // 2. Try INSERT with insert()
  const payload1 = {
    company_id: '0553618d-1d44-4f24-b6d8-7981fd4c6427',
    month: 8,
    year: 2026,
    notes: 'Test Insert 1',
    status: 'active',
    updated_at: new Date().toISOString()
  };

  console.log('\nTesting insert():', payload1);
  const result1 = await supabase
    .from('salary_months')
    .insert([payload1])
    .select('*')
    .single();

  console.log('insert() Result:', result1);

  if (result1.data?.id) {
    console.log('🎉 insert() SUCCESS! Cleaning up...');
    await supabase.from('salary_months').delete().eq('id', result1.data.id);
  }

  // 3. Try UPSERT with upsert()
  const payload2 = {
    company_id: '0553618d-1d44-4f24-b6d8-7981fd4c6427',
    month: 8,
    year: 2026,
    notes: 'Test Upsert 2',
    status: 'active',
    updated_at: new Date().toISOString()
  };

  console.log('\nTesting upsert():', payload2);
  const result2 = await supabase
    .from('salary_months')
    .upsert([payload2])
    .select('*')
    .single();

  console.log('upsert() Result:', result2);

  if (result2.data?.id) {
    console.log('🎉 upsert() SUCCESS! Cleaning up...');
    await supabase.from('salary_months').delete().eq('id', result2.data.id);
  }
}

inspectSalaryMonths().catch(err => console.error(err));
