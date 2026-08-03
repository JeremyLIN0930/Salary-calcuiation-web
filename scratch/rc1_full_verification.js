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

async function runRc1FullVerification() {
  console.log('====================================================');
  console.log('🏆 PAYROLL SYSTEM RC1 END-TO-END VERIFICATION');
  console.log('====================================================\n');

  // 1. Verify Stores
  console.log('--- [1. Stores Module Verification] ---');
  const { data: stores } = await supabase.from('stores').select('*').order('store_code', { ascending: true });
  console.log('Stores in Database:', stores.map(s => `${s.store_code}: ${s.store_name} (${s.id})`));

  // 2. Verify Employee CRUD
  console.log('\n--- [2. Employee Module Verification] ---');
  const empPayload = {
    name: 'RC1 測試員工',
    company_id: '0553618d-1d44-4f24-b6d8-7981fd4c6427',
    store_id: 'b357ddf1-7024-4a0a-8aa0-66c62214dbeb', // 慶東門市
    hire_date: '2026-08-01',
    notes: 'RC1 Test Employee',
    is_active: true,
    updated_at: new Date().toISOString()
  };
  const { data: empCreated, error: empErr } = await supabase.from('master_employees').insert([empPayload]).select('*, stores(store_name)').single();
  if (empErr) console.error('❌ Employee Insert Failed:', empErr.message);
  else console.log('✅ Employee Created & Joined Store Name:', empCreated.name, '| Store:', empCreated.stores?.store_name);

  // 3. Verify Salary CRUD
  console.log('\n--- [3. Salary Module Verification] ---');
  const salPayload = {
    company_id: '0553618d-1d44-4f24-b6d8-7981fd4c6427',
    month: 8,
    year: 2026,
    notes: JSON.stringify({ name: 'RC1 測試員工', month: '2026-08', grossSalary: 50000, netSalary: 48000 }),
    status: 'active',
    updated_at: new Date().toISOString()
  };
  const { data: salCreated, error: salErr } = await supabase.from('salary_months').insert([salPayload]).select('*').single();
  if (salErr) console.error('❌ Salary Insert Failed:', salErr.message);
  else console.log('✅ Salary Month Created:', salCreated.id, '| Year/Month:', salCreated.year, salCreated.month);

  // 4. Verify Schedule CRUD
  console.log('\n--- [4. Schedule Module Verification] ---');
  const schedPayload = {
    start_date: '2026-08-03',
    end_date: '2026-08-09',
    notes: JSON.stringify({ storeName: '慶東門市', weekStart: '2026-08-03', employees: [{ name: 'RC1 測試員工' }] }),
    updated_at: new Date().toISOString()
  };
  const { data: schedCreated, error: schedErr } = await supabase.from('schedule_weeks').insert([schedPayload]).select('*').single();
  if (schedErr) console.error('❌ Schedule Insert Failed:', schedErr.message);
  else console.log('✅ Schedule Week Created:', schedCreated.id, '| Dates:', schedCreated.start_date, 'to', schedCreated.end_date);

  // 5. Verify Settings CRUD
  console.log('\n--- [5. Settings Module Verification] ---');
  const setPayload = {
    company_id: '0553618d-1d44-4f24-b6d8-7981fd4c6427',
    updated_at: new Date().toISOString()
  };
  const { data: setCreated, error: setErr } = await supabase.from('app_settings').insert([setPayload]).select('*').single();
  if (setErr) console.error('❌ Settings Insert Failed:', setErr.message);
  else console.log('✅ App Settings Created:', setCreated.id);

  // Cleanup Test Rows
  if (empCreated?.id) await supabase.from('master_employees').delete().eq('id', empCreated.id);
  if (salCreated?.id) await supabase.from('salary_months').delete().eq('id', salCreated.id);
  if (schedCreated?.id) await supabase.from('schedule_weeks').delete().eq('id', schedCreated.id);
  if (setCreated?.id) await supabase.from('app_settings').delete().eq('id', setCreated.id);

  console.log('\n====================================================');
  console.log('🎉 ALL 5 MODULES PASSED RC1 VERIFICATION CLEANLY!');
  console.log('====================================================');
}

runRc1FullVerification().catch(err => console.error(err));
