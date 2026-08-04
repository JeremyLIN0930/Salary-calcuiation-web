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

async function checkIsSharedColumn() {
  console.log('=== CHECKING IS_SHARED COLUMN IN MASTER_EMPLOYEES ===\n');

  const { data, error } = await supabase.from('master_employees').select('id, is_shared').limit(1);
  if (error) {
    console.log('Error selecting is_shared:', error.message);
    console.log('Column is_shared might not exist yet.');
  } else {
    console.log('Column is_shared exists! Data sample:', data);
  }
}

checkIsSharedColumn().catch(err => console.error(err));
