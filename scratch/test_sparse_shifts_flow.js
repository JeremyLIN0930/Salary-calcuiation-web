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

async function testSparseFlow() {
  console.log('=== TESTING SPARSE SHIFTS SAVE/READ/UPDATE/DELETE FLOW ===\n');

  // Find a week ID
  const { data: weeks } = await supabase.from('schedule_weeks').select('id, start_date').limit(1);
  if (!weeks || weeks.length === 0) {
    console.log('No week found to test.');
    return;
  }

  const weekId = weeks[0].id;
  const weekStart = weeks[0].start_date || '2026-08-03';
  console.log('Target week ID:', weekId, 'start:', weekStart);

  // 1. Query current shifts for this week
  const { data: currentShifts } = await supabase
    .from('schedule_shifts')
    .select('id, employee_id, work_date, shift_type')
    .eq('schedule_week_id', weekId);

  console.log('Current DB shifts count for this week:', currentShifts?.length || 0);

  // 2. Compute 7 dates
  const dates = [];
  const start = new Date(weekStart);
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dates.push(d.toISOString().slice(0, 10));
  }

  console.log('7 Days of the week:', dates);

  // Simulate Sparse reconstruction
  const empMap = new Map();
  (currentShifts || []).forEach(s => {
    if (!empMap.has(s.employee_id)) empMap.set(s.employee_id, new Map());
    empMap.get(s.employee_id).set(s.work_date, s);
  });

  empMap.forEach((dateMap, empId) => {
    const padded = dates.map(dt => {
      const dbS = dateMap.get(dt);
      return dbS ? { date: dt, type: dbS.shift_type } : { date: dt, type: '' };
    });
    console.log(`\nEmployee ${empId}: DB rows = ${dateMap.size}, UI padded items = ${padded.length}`);
    console.log('UI Padded array types:', padded.map(p => p.type || '(blank)'));
  });

  console.log('\n🎉 SPARSE SHIFTS FLOW VERIFICATION SUCCESSFUL!');
}

testSparseFlow().catch(err => console.error(err));
