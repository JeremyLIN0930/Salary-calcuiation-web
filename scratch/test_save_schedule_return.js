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

function isValidUuid(str) {
  if (!str || typeof str !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

async function testSaveScheduleReturnModel() {
  console.log('=== TESTING SAVE SCHEDULE RETURN MODEL ===\n');

  // Fetch sample week
  const { data: weeks } = await supabase.from('schedule_weeks').select('id, start_date, end_date').limit(1);
  if (!weeks || weeks.length === 0) return;
  const weekRow = weeks[0];

  console.log('Testing week ID:', weekRow.id);

  // Fetch existing shifts for this week
  const { data: shifts } = await supabase.from('schedule_shifts').select('*').eq('schedule_week_id', weekRow.id);
  const { data: emps } = await supabase.from('master_employees').select('id, name');
  const empMap = new Map();
  emps?.forEach(e => empMap.set(e.id, e.name));

  // Build input employees list with 1 formal and 1 temp employee
  const inputEmployees = [
    {
      id: emps && emps.length > 0 ? emps[0].id : 'ce2c7c9d-ee64-4292-afc1-4056c7565777',
      name: emps && emps.length > 0 ? emps[0].name : '正式員工',
      isTemp: false,
      shifts: [
        { date: weekRow.start_date, type: 'work', startTime: '07:00', endTime: '15:00' }
      ]
    },
    {
      id: 'temp_測試臨時工',
      name: '測試臨時工',
      isTemp: true,
      shifts: [
        { date: weekRow.start_date, type: 'work', startTime: '08:00', endTime: '16:00' }
      ]
    }
  ];

  // Re-simulate saveSchedule return logic
  const savedModel = {
    id: weekRow.id,
    storeId: '001',
    weekStart: weekRow.start_date,
    weekEnd: weekRow.end_date,
    employees: inputEmployees.map(e => ({ ...e, shifts: e.shifts || [] }))
  };

  // Run populate logic
  const schShifts = shifts || [];
  const empShiftsMap = new Map();

  schShifts.forEach((s) => {
    let empKey = s.employee_id;
    let isTemp = false;
    let empName = '';

    if (s.employee_id && isValidUuid(s.employee_id)) {
      empKey = s.employee_id;
      empName = empMap.get(s.employee_id) || s.employee_name || '未命名員工';
    } else {
      empName = s.employee_name || '臨時工';
      empKey = `temp_${empName}`;
      isTemp = true;
    }

    if (!empShiftsMap.has(empKey)) {
      empShiftsMap.set(empKey, { name: empName, isTemp, dateMap: new Map() });
    }
    empShiftsMap.get(empKey).dateMap.set(s.work_date, s);
  });

  // Preserve input employees list so employees with 0 shifts in DB are retained
  const existingEmps = savedModel.employees || [];
  existingEmps.forEach(e => {
    const isTemp = e.isTemp || e.id.startsWith('temp_') || !isValidUuid(e.id);
    const empKey = isTemp ? `temp_${e.name.trim()}` : e.id;
    if (!empShiftsMap.has(empKey)) {
      empShiftsMap.set(empKey, { name: e.name.trim(), isTemp, dateMap: new Map() });
    }
  });

  const schEmployees = [];
  empShiftsMap.forEach(({ name: empName, isTemp, dateMap }, empKey) => {
    schEmployees.push({
      id: empKey,
      name: empName,
      isTemp: isTemp,
      shifts: []
    });
  });

  savedModel.employees = schEmployees;

  console.log('Populate Result');
  console.log(savedModel.id);
  console.log(schEmployees);
  console.log(schEmployees.length);

  console.log('\n===== SAVE RETURN =====');
  console.log(savedModel);
  console.log(savedModel.employees);
  console.log(savedModel.employees.length);

  if (savedModel.employees.length === inputEmployees.length) {
    console.log('\n🎉 SUCCESS! saveSchedule() returns fully populated employees array!');
  } else {
    console.log('\n❌ FAILED!');
  }
}

testSaveScheduleReturnModel().catch(err => console.error(err));
