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

async function addColumn() {
  console.log('=== ADDING IS_SHARED COLUMN VIA RPC/SQL ===\n');
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: 'ALTER TABLE master_employees ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT TRUE;'
  });

  if (error) {
    console.log('RPC exec_sql error:', error.message);
  } else {
    console.log('RPC exec_sql result:', data);
  }
}

addColumn().catch(err => console.error(err));
