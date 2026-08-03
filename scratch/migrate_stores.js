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

async function updateStore001() {
  console.log('=== UPDATING STORE 001 TO 慶東門市 ===');
  const { data, error } = await supabase
    .from('stores')
    .update({ store_name: '慶東門市', store_code: '001' })
    .eq('id', 'b357ddf1-7024-4a0a-8aa0-66c62214dbeb')
    .select('*');

  if (error) {
    console.error('Update Store Error:', error.message);
  } else {
    console.log('Store 001 updated:', data);
  }

  const { data: finalStores } = await supabase.from('stores').select('*');
  console.log('Stores in DB:', finalStores);
}

updateStore001().catch(err => console.error(err));
