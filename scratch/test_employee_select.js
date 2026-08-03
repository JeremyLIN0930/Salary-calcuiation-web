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

async function testSelectWithJoin() {
  console.log('=== TESTING SELECT WITH JOIN ===');
  const { data, error } = await supabase
    .from('master_employees')
    .select(`
      *,
      stores (
        id,
        store_name,
        store_code
      ),
      companies (
        id,
        company_name
      )
    `)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('❌ Select Error:', error.message, error.details);
  } else {
    console.log('✅ Select OK, returned rows:', data.length);
    if (data.length > 0) {
      console.log('Sample Row:', JSON.stringify(data[0], null, 2));
    }
  }
}

testSelectWithJoin().catch(err => console.error(err));
