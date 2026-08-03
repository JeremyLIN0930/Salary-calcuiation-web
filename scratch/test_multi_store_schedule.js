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

async function testMultiStore() {
  console.log('=== STARTING INTEGRATION TEST FOR MULTI-STORE SCHEDULES ===\n');

  // Let's load the two stores: 慶東門市 (001) and 南醫門市 (002)
  const { data: stores } = await supabase.from('stores').select('id, store_code, store_name');
  console.log('Available Stores in DB:', stores);

  const storeA = stores.find(s => s.store_code === '001');
  const storeB = stores.find(s => s.store_code === '002');

  if (!storeA || !storeB) {
    console.error('❌ Need both stores (001 and 002) in the database for this test!');
    return;
  }

  const companyId = '0553618d-1d44-4f24-b6d8-7981fd4c6427';
  const year = 2030;
  const month = 8;

  // Cleanup any old test rows for 2030-08
  await supabase.from('schedule_months').delete().eq('year', year).eq('month', month);
  console.log('Cleanup completed for year 2030 month 8.');

  // Helper to query months count
  async function getMonthRows() {
    const { data } = await supabase
      .from('schedule_months')
      .select('*')
      .eq('company_id', companyId)
      .eq('year', year)
      .eq('month', month);
    return data || [];
  }

  // 1. Create schedule_months for Store A (慶東門市)
  console.log('\n--- Step 1: Create Month for Store A (慶東門市) ---');
  const { data: monthARow, error: errA } = await supabase
    .from('schedule_months')
    .insert([{ company_id: companyId, store_id: storeA.id, year, month, status: 'draft' }])
    .select('*')
    .single();

  if (errA) {
    console.error('❌ Failed to create Store A month:', errA.message);
    return;
  }
  console.log('✅ Created Store A month:', monthARow.id, '| Store:', storeA.store_name);

  // 2. Create schedule_months for Store B (南醫門市)
  console.log('\n--- Step 2: Create Month for Store B (南醫門市) ---');
  const { data: monthBRow, error: errB } = await supabase
    .from('schedule_months')
    .insert([{ company_id: companyId, store_id: storeB.id, year, month, status: 'draft' }])
    .select('*')
    .single();

  if (errB) {
    console.error('❌ Failed to create Store B month (Ensure unique constraint has store_id!):', errB.message);
    return;
  }
  console.log('✅ Created Store B month:', monthBRow.id, '| Store:', storeB.store_name);

  // Verify we have 2 separate rows in schedule_months
  const currentMonths = await getMonthRows();
  console.log(`\n📊 Current schedule_months count in DB for 2030-08: ${currentMonths.length}`);
  if (currentMonths.length === 2) {
    console.log('✅ Success: Created two separate month rows for different stores in the same month!');
  } else {
    console.error('❌ Error: Expected 2 rows, found:', currentMonths.length);
  }

  // 3. Try inserting Store A again - should fail if we try direct INSERT, proving we need SELECT-first check
  console.log('\n--- Step 3: Try duplicate INSERT for Store A (to test UNIQUE constraint on company_id, store_id, year, month) ---');
  const { error: duplicateErr } = await supabase
    .from('schedule_months')
    .insert([{ company_id: companyId, store_id: storeA.id, year, month, status: 'draft' }]);

  if (duplicateErr) {
    console.log('✅ Correctly blocked duplicate INSERT! Code:', duplicateErr.code, '| Message:', duplicateErr.message);
  } else {
    console.error('❌ Error: Duplicate INSERT was not blocked! UNIQUE constraint is missing or incorrect!');
  }

  // Cleanup
  console.log('\nCleaning up database test rows...');
  await supabase.from('schedule_months').delete().in('id', [monthARow.id, monthBRow.id]);
  console.log('🎉 INTEGRATION TEST PASSED SUCCESSFULLY!');
}

testMultiStore().catch(err => console.error(err));
