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

async function testCompanyInsert() {
  const { data: stores } = await supabase.from('stores').select('*').limit(1);
  const store = stores && stores[0] ? stores[0] : null;
  console.log('Store in DB:', store);

  const payload = {
    name: '張大明 (測試員工)',
    store_id: store ? store.id : null,
    company_id: store ? store.company_id : null,
    hire_date: '2026-08-01',
    notes: 'RLS Insert Test',
    is_active: true,
    updated_at: new Date().toISOString(),
  };

  console.log('Inserting payload:', JSON.stringify(payload, null, 2));

  const { data, error } = await supabase
    .from('master_employees')
    .insert([payload])
    .select('*')
    .single();

  if (error) {
    console.error('❌ Insert Error:', error.message, '| Details:', error.details, '| Hint:', error.hint);
  } else {
    console.log('🎉 INSERT SUCCESS! Row created:', data);
    // Delete test row
    await supabase.from('master_employees').delete().eq('id', data.id);
  }
}

testCompanyInsert().catch(err => console.error(err));
