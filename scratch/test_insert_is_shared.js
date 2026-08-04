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

async function testInsertIsShared() {
  console.log('=== TESTING INSERT WITH IS_SHARED ===\n');

  const payload = {
    name: '測試員工_IS_SHARED',
    company_id: '0553618d-1d44-4f24-b6d8-7981fd4c6427',
    is_shared: true
  };

  const { data, error } = await supabase
    .from('master_employees')
    .insert([payload])
    .select('id');

  if (error) {
    console.log('Insert error:', error.message);
  } else {
    console.log('Insert success! New ID:', data[0]?.id);
    // Cleanup
    await supabase.from('master_employees').delete().eq('id', data[0]?.id);
  }
}

testInsertIsShared().catch(err => console.error(err));
