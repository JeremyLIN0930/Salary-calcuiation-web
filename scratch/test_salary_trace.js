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

async function testSalaryTrace() {
  console.log('=== SALARY CRUD TRACE & SUPABASE TEST ===');

  // Step 1: Form Payload
  const formPayload = {
    id: '',
    name: '林美玲',
    month: '2026-08',
    store: '慶東門市',
    baseSalary: 42000,
    mealAllowance: 2400,
    grossSalary: 44400,
    laborInsurance: 1100,
    healthInsurance: 650,
    totalDeductions: 1750,
    netSalary: 42650,
    remark: '8月份測試薪資單',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  console.log('① FORM Payload:', formPayload);

  // Step 2: Context Payload
  console.log('② CONTEXT Payload:', formPayload);

  // Step 3: Repository Payload (Mapper)
  const cleanPayload = {};
  for (const [k, v] of Object.entries(formPayload)) {
    if (v === undefined || v === null) continue;
    if (typeof v === 'string' && v.trim() === '') cleanPayload[k] = null;
    else cleanPayload[k] = v;
  }

  const dbRow = {
    company_id: '0553618d-1d44-4f24-b6d8-7981fd4c6427',
    month: 8,
    year: 2026,
    notes: JSON.stringify(cleanPayload),
    status: 'active',
    updated_at: new Date().toISOString()
  };
  console.log('③ Repository Payload:', dbRow);

  // Step 4: Supabase INSERT Response
  const { data, error } = await supabase.from('salary_months').insert([dbRow]).select('*').single();
  console.log('④ Supabase INSERT Response Data:', data, 'Error:', error);

  if (error) {
    console.error('❌ Supabase INSERT Failed:', error.message);
    return;
  }

  console.log('🎉 INSERT SUCCESS! Generated ID:', data.id);

  // Step 5: refresh()
  console.log('⑤ refresh()');

  // Step 6: SELECT Query
  const { data: selectData, error: selectErr } = await supabase.from('salary_months').select('*').order('updated_at', { ascending: false });
  console.log('⑥ SELECT Query Data:', selectData);

  if (selectData && selectData.length > 0) {
    const readRow = selectData.find(r => r.id === data.id);
    if (readRow) {
      const restoredModel = JSON.parse(readRow.notes);
      console.log('✅ Restored Salary Model from Supabase:', restoredModel);
      console.log('✅ Salary Name:', restoredModel.name, '| Net Salary:', restoredModel.netSalary);
    }
  }

  // Cleanup test row
  await supabase.from('salary_months').delete().eq('id', data.id);
  console.log('Cleaned up test row.');
}

testSalaryTrace().catch(err => console.error(err));
