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

async function testStatusValues() {
  console.log('=== TESTING STATUS VALUES FOR salary_months ===\n');

  const candidateStatuses = ['draft', 'confirmed', 'locked', 'pending', 'paid', 'approved', 'closed'];

  for (const st of candidateStatuses) {
    const payload = {
      company_id: '0553618d-1d44-4f24-b6d8-7981fd4c6427',
      month: 8,
      year: 2026,
      notes: `Test status ${st}`,
      status: st,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase.from('salary_months').insert([payload]).select('*').single();
    if (error) {
      console.log(`❌ Status "${st}": FAILED ->`, error.code, error.message);
    } else {
      console.log(`✅ Status "${st}": SUCCESS -> ID ${data.id}`);
      await supabase.from('salary_months').delete().eq('id', data.id);
    }
  }
}

testStatusValues().catch(err => console.error(err));
