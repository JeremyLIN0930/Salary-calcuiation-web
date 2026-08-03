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

async function testDirectRepoRead() {
  console.log('=== DIRECT READ TEST FOR SCHEDULE REPOSITORY ===\n');

  // Query schedule_weeks
  const { data: weeks, error: wErr } = await supabase.from('schedule_weeks').select('*');
  console.log('Total schedule_weeks in DB:', weeks?.length || 0);

  if (wErr || !weeks || weeks.length === 0) {
    console.log('Error or no weeks:', wErr);
    return;
  }

  const weekIds = weeks.map(w => w.id);

  // Query schedule_shifts
  const { data: shifts, error: sErr } = await supabase
    .from('schedule_shifts')
    .select('*')
    .in('schedule_week_id', weekIds);

  console.log('Total schedule_shifts in DB for these weeks:', shifts?.length || 0);

  // Query master_employees
  const { data: emps } = await supabase.from('master_employees').select('id, name');
  const empMap = new Map();
  (emps || []).forEach(e => empMap.set(e.id, e.name));

  // Build shifts map
  const shiftsByWeek = new Map();
  (shifts || []).forEach(s => {
    const wId = (s.schedule_week_id || '').toLowerCase();
    if (!shiftsByWeek.has(wId)) shiftsByWeek.set(wId, []);
    shiftsByWeek.get(wId).push(s);
  });

  weeks.forEach(w => {
    const wIdKey = (w.id || '').toLowerCase();
    const wShifts = shiftsByWeek.get(wIdKey) || [];

    const empShiftsMap = new Map();
    wShifts.forEach(s => {
      if (!empShiftsMap.has(s.employee_id)) empShiftsMap.set(s.employee_id, []);
      empShiftsMap.get(s.employee_id).push(s);
    });

    const schEmployees = [];
    empShiftsMap.forEach((eShifts, empId) => {
      schEmployees.push({
        id: empId,
        name: empMap.get(empId) || '未命名員工',
        shifts: eShifts.map(s => ({
          date: s.work_date,
          type: s.shift_type,
          startTime: s.start_time || undefined,
          endTime: s.end_time || undefined,
          remark: s.remarks || undefined
        }))
      });
    });

    console.log("Schedule ID", w.id);
    console.log("Shifts", wShifts.length);
    console.log("Employees", schEmployees);
  });
}

testDirectRepoRead().catch(err => console.error(err));
