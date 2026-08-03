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

async function testSalaryInsert() {
  const { data: companies } = await supabase.from('companies').select('*').limit(1);
  const companyId = companies && companies[0] ? companies[0].id : null;

  const { data, error } = await supabase
    .from('salary_months')
    .insert([{ company_id: companyId, year: 2026, month: 8, status: 'draft' }])
    .select('*');

  if (error) {
    console.log('salary_months insert error:', error.message);
  } else {
    console.log('salary_months insert SUCCESS! ID:', data[0].id);
    await supabase.from('salary_months').delete().eq('id', data[0].id);
  }
}

testSalaryInsert().catch(err => console.error(err));
