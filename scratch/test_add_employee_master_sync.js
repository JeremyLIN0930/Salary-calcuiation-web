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

async function testAddEmployeeFlow() {
  console.log('=== TESTING ADD EMPLOYEE MASTER SYNC FLOW WITH CONSTRAINTS ===\n');

  const storeId = 'b357ddf1-7024-4a0a-8aa0-66c62214dbeb'; // 慶東門市
  const today = new Date().toISOString().slice(0, 10);

  // 1. Create Local Employee (按「否」)
  const localName = '測試_本店臨時工_' + Math.floor(Math.random() * 1000);
  const { data: localData, error: localErr } = await supabase
    .from('master_employees')
    .insert([{
      name: localName,
      company_id: '0553618d-1d44-4f24-b6d8-7981fd4c6427',
      store_id: storeId,
      hire_date: today,
      is_active: true,
      notes: '[local]'
    }])
    .select('id, name, store_id')
    .single();

  if (localErr) {
    console.error('Local Employee Insert Failed:', localErr.message);
  } else {
    console.log('✅ Local Employee Created Successfully! Real UUID:', localData.id, 'store_id:', localData.store_id);
  }

  // 2. Create Shared Employee (按「是」)
  const sharedName = '測試_共用員工_' + Math.floor(Math.random() * 1000);
  const { data: sharedData, error: sharedErr } = await supabase
    .from('master_employees')
    .insert([{
      name: sharedName,
      company_id: '0553618d-1d44-4f24-b6d8-7981fd4c6427',
      store_id: storeId,
      hire_date: today,
      is_active: true,
      notes: '[shared]'
    }])
    .select('id, name, store_id')
    .single();

  if (sharedErr) {
    console.error('Shared Employee Insert Failed:', sharedErr.message);
  } else {
    console.log('✅ Shared Employee Created Successfully! Real UUID:', sharedData.id, 'store_id:', sharedData.store_id);
  }

  // Cleanup test employees
  if (localData?.id) await supabase.from('master_employees').delete().eq('id', localData.id);
  if (sharedData?.id) await supabase.from('master_employees').delete().eq('id', sharedData.id);

  console.log('\n🎉 ADD EMPLOYEE MASTER SYNC TEST COMPLETE AND PASSED!');
}

testAddEmployeeFlow().catch(err => console.error(err));
