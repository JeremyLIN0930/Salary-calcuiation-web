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

const COMPANY_ID = '0553618d-1d44-4f24-b6d8-7981fd4c6427';
const STORES = {
  KE_DONG: 'b357ddf1-7024-4a0a-8aa0-66c62214dbeb', // 慶東門市 001
  NAN_YI:  'c468eee2-8135-5b1b-9bb1-77d73325ecef', // 南醫門市 002
};

async function testStoreArchitecture() {
  console.log('=== TESTING FORM -> REPOSITORY -> SUPABASE STORE ARCHITECTURE ===');

  // Test 1: Insert Employee for 慶東門市 (001)
  const emp1Payload = {
    name: '慶東員工 (測試1)',
    company_id: COMPANY_ID,
    store_id: STORES.KE_DONG,
    hire_date: '2026-08-01',
    notes: 'Test 001',
    is_active: true,
    updated_at: new Date().toISOString()
  };

  console.log('\n[Test 1] INSERT Payload (慶東門市):', emp1Payload);
  const { data: data1, error: err1 } = await supabase.from('master_employees').insert([emp1Payload]).select('*, stores(store_name)').single();
  if (err1) {
    console.error('❌ Test 1 Error:', err1.message);
  } else {
    console.log('🎉 Test 1 Insert SUCCESS! Joined Store Name:', data1.stores?.store_name);
  }

  // Test 2: Insert Employee for 南醫門市 (002)
  const emp2Payload = {
    name: '南醫員工 (測試2)',
    company_id: COMPANY_ID,
    store_id: STORES.NAN_YI,
    hire_date: '2026-08-02',
    notes: 'Test 002',
    is_active: true,
    updated_at: new Date().toISOString()
  };

  console.log('\n[Test 2] INSERT Payload (南醫門市):', emp2Payload);
  const { data: data2, error: err2 } = await supabase.from('master_employees').insert([emp2Payload]).select('*, stores(store_name)').single();
  if (err2) {
    console.error('❌ Test 2 Error:', err2.message);
  } else {
    console.log('🎉 Test 2 Insert SUCCESS! Joined Store Name:', data2.stores?.store_name);
  }

  // Test 3: SELECT ALL & Verify JOIN Output
  console.log('\n[Test 3] SELECT ALL & VERIFY STORE_NAME JOIN:');
  const { data: allEmp } = await supabase.from('master_employees').select('*, stores(store_code, store_name)').order('updated_at', { ascending: false });
  console.log(`Total employees in master_employees: ${allEmp.length}`);
  allEmp.forEach(e => {
    console.log(`- ID: ${e.id} | Name: ${e.name} | store_id: ${e.store_id} | Joined store_name: ${e.stores?.store_name || 'N/A'}`);
  });

  // Cleanup test employees
  if (data1?.id) await supabase.from('master_employees').delete().eq('id', data1.id);
  if (data2?.id) await supabase.from('master_employees').delete().eq('id', data2.id);
  console.log('\nCleaned up test employees successfully.');
}

testStoreArchitecture().catch(err => console.error(err));
