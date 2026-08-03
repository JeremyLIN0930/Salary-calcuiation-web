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

async function testSalaryDraftInsert() {
  console.log('=== SALARY DRAFT INSERT VERIFICATION ===\n');

  const model = {
    name: '張偉強',
    month: '2026-08',
    store: '慶東門市',
    baseSalary: 45000,
    grossSalary: 48000,
    netSalary: 46000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const payload = {
    company_id: '0553618d-1d44-4f24-b6d8-7981fd4c6427',
    month: 8,
    year: 2026,
    notes: JSON.stringify(model),
    status: 'draft',
    updated_at: model.updatedAt
  };

  console.log('Salary INSERT Payload', payload);

  const { data, error } = await supabase.from('salary_months').insert([payload]).select('*').single();

  if (error) {
    console.error('❌ Insert Error:', error.code, error.message);
    if (error.code === '23514') {
      console.error('❌ Check constraint violation! Check status:', payload.status);
    }
  } else {
    console.log('✅ Insert SUCCESS! Row ID:', data.id);
    console.log('✅ Returned Row Status:', data.status);

    // Verify Read back
    const { data: readRow, error: readErr } = await supabase.from('salary_months').select('*').eq('id', data.id).single();
    if (readRow) {
      console.log('✅ SELECT after INSERT Verified! Name:', JSON.parse(readRow.notes).name);
    }

    // Clean up
    await supabase.from('salary_months').delete().eq('id', data.id);
    console.log('Cleaned up test row.');
  }
}

testSalaryDraftInsert().catch(err => console.error(err));
