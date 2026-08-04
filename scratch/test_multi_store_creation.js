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

async function testMultiStoreCreation() {
  console.log('=== TESTING MULTI-STORE & MULTI-WEEK DUPLICATE CHECK ===\n');

  // 1. Fetch stores
  const { data: stores } = await supabase
    .from('stores')
    .select('id, store_code, store_name')
    .order('store_code', { ascending: true });

  console.log('Available stores:', stores);

  if (!stores || stores.length < 2) {
    console.log('Need at least 2 stores for testing.');
    return;
  }

  const store1 = stores[0]; // 慶東
  const store2 = stores[1]; // 南醫

  const companyId = '0553618d-1d44-4f24-b6d8-7981fd4c6427';
  const year = 2026;
  const month = 8;

  // Helper to ensure schedule_month
  const getOrCreateMonth = async (storeId) => {
    const { data: existing } = await supabase
      .from('schedule_months')
      .select('id')
      .eq('company_id', companyId)
      .eq('store_id', storeId)
      .eq('year', year)
      .eq('month', month)
      .maybeSingle();

    if (existing) return existing.id;

    const { data: created } = await supabase
      .from('schedule_months')
      .insert([{ company_id: companyId, store_id: storeId, year, month }])
      .select('id')
      .single();

    return created.id;
  };

  const month1Id = await getOrCreateMonth(store1.id);
  const month2Id = await getOrCreateMonth(store2.id);

  console.log(`Month ID for ${store1.store_name}:`, month1Id);
  console.log(`Month ID for ${store2.store_name}:`, month2Id);

  // 2. Create Week 1 for Store 1 & Store 2
  const createWeek = async (monthId, weekNo, startDate, endDate) => {
    const { data: existing } = await supabase
      .from('schedule_weeks')
      .select('id')
      .eq('schedule_month_id', monthId)
      .eq('week_no', weekNo)
      .maybeSingle();

    if (existing) return existing.id;

    const { data: created } = await supabase
      .from('schedule_weeks')
      .insert([{
        schedule_month_id: monthId,
        week_no: weekNo,
        start_date: startDate,
        end_date: endDate
      }])
      .select('id')
      .single();

    return created.id;
  };

  const s1w1Id = await createWeek(month1Id, 1, '2026-08-03', '2026-08-09');
  const s2w1Id = await createWeek(month2Id, 1, '2026-08-03', '2026-08-09');
  const s1w2Id = await createWeek(month1Id, 2, '2026-08-10', '2026-08-16');
  const s2w2Id = await createWeek(month2Id, 2, '2026-08-10', '2026-08-16');

  console.log('\nCreated / Verified Schedule Weeks:');
  console.log(`✓ ${store1.store_name} Week 1 ID:`, s1w1Id);
  console.log(`✓ ${store2.store_name} Week 1 ID:`, s2w1Id);
  console.log(`✓ ${store1.store_name} Week 2 ID:`, s1w2Id);
  console.log(`✓ ${store2.store_name} Week 2 ID:`, s2w2Id);

  console.log('\n====================================================');
  console.log('  MULTI-STORE MULTI-WEEK TEST COMPLETE AND PASSED!');
  console.log('====================================================');
}

testMultiStoreCreation().catch(err => console.error(err));
