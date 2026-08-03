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

async function testSalarySmallintMonth() {
  console.log('=== TESTING SALARY MONTH SMALLINT TYPE ===');

  const salarySample = {
    name: '張大華 (測試薪資)',
    month: '2026-08',
    baseSalary: 45000,
    mealAllowance: 3000,
    grossSalary: 53000,
    netSalary: 51200,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const monthNum = parseInt('2026-08'.slice(5, 7), 10) || 8; // 8 (smallint)

  const salaryDbRow = {
    company_id: '0553618d-1d44-4f24-b6d8-7981fd4c6427',
    month: monthNum,
    year: 2026,
    notes: JSON.stringify(salarySample),
    status: 'active',
    updated_at: new Date().toISOString()
  };

  console.log('\n[Salary Payload]:', salaryDbRow);
  const { data: salData, error: salErr } = await supabase.from('salary_months').insert([salaryDbRow]).select('*').single();
  if (salErr) {
    console.error('❌ Salary Insert Error:', salErr.message);
  } else {
    console.log('🎉 Salary Insert SUCCESS! ID:', salData.id);

    // Re-read
    const { data: readSal } = await supabase.from('salary_months').select('*').eq('id', salData.id).single();
    const parsedSalary = JSON.parse(readSal.notes);
    console.log('🔄 Re-read Salary Object:', parsedSalary);
    if (parsedSalary.grossSalary === 53000) {
      console.log('✅ Salary Smallint Month & F5 Persistence PASSED!');
    }
    await supabase.from('salary_months').delete().eq('id', salData.id);
  }
}

testSalarySmallintMonth().catch(err => console.error(err));
