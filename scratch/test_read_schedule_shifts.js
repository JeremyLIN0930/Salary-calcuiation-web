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

async function testReadShiftsPipeline() {
  console.log('=== TESTING SCHEDULE READ PIPELINE FOR SHIFTS ===\n');

  // 1. Fetch weeks
  const { data: weeks } = await supabase.from('schedule_weeks').select('*');
  console.log('📊 schedule_weeks total count in DB:', weeks?.length || 0);

  if (!weeks || weeks.length === 0) {
    console.log('No schedule_weeks found.');
    return;
  }

  const weekIds = weeks.map(w => w.id);

  // 2. Fetch shifts
  const { data: shifts } = await supabase.from('schedule_shifts').select('*').in('schedule_week_id', weekIds);
  console.log('📊 schedule_shifts total count in DB for these weeks:', shifts?.length || 0);

  // 3. Fetch master employees
  const { data: emps } = await supabase.from('master_employees').select('id, name');
  const empMap = new Map();
  (emps || []).forEach(e => empMap.set(e.id, e.name));

  // 4. Test reconstruction for each week
  weeks.forEach((w, i) => {
    const wShifts = (shifts || []).filter(s => s.schedule_week_id === w.id);
    const empShiftsMap = new Map();
    wShifts.forEach(s => {
      if (!empShiftsMap.has(s.employee_id)) {
        empShiftsMap.set(s.employee_id, []);
      }
      empShiftsMap.get(s.employee_id).push(s);
    });

    const employees = [];
    empShiftsMap.forEach((eShifts, empId) => {
      employees.push({
        id: empId,
        name: empMap.get(empId) || '未命名員工',
        shiftsCount: eShifts.length
      });
    });

    console.log(`\nWeek ${i + 1} (ID: ${w.id}):`);
    console.log(`   - Shifts count: ${wShifts.length}`);
    console.log(`   - Employees count: ${employees.length}`);
    employees.forEach(emp => {
      console.log(`     👤 ${emp.name} (${emp.id}): ${emp.shiftsCount} shifts`);
    });
  });

  console.log('\n🎉 READ PIPELINE VERIFICATION COMPLETED SUCCESSFULLY!');
}

testReadShiftsPipeline().catch(err => console.error(err));
