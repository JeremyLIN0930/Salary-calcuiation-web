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

async function deduplicateMasterEmployees() {
  console.log('=== DEDUPLICATING MASTER_EMPLOYEES IN SUPABASE ===\n');

  // 1. Fetch all master_employees
  const { data: allEmps, error } = await supabase
    .from('master_employees')
    .select('id, name, created_at')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Failed to fetch master_employees:', error.message);
    return;
  }

  console.log(`Total rows in master_employees before cleanup: ${allEmps.length}`);

  // 2. Group by trimmed name
  const nameGroups = new Map();
  allEmps.forEach(emp => {
    const name = emp.name.trim();
    if (!nameGroups.has(name)) {
      nameGroups.set(name, []);
    }
    nameGroups.get(name).push(emp);
  });

  let totalRemoved = 0;

  for (const [name, rows] of nameGroups.entries()) {
    if (rows.length > 1) {
      console.log(`\nFound ${rows.length} duplicate rows for employee: "${name}"`);
      const keptRow = rows[0]; // Earliest created
      const duplicateRows = rows.slice(1);
      const duplicateIds = duplicateRows.map(r => r.id);

      console.log(`  Kept ID: ${keptRow.id}`);
      console.log(`  Duplicate IDs to remove:`, duplicateIds);

      // Re-point any schedule_shifts using duplicateIds to keptRow.id
      for (const dupId of duplicateIds) {
        const { error: repointErr } = await supabase
          .from('schedule_shifts')
          .update({ employee_id: keptRow.id })
          .eq('employee_id', dupId);

        if (repointErr) {
          console.warn(`  Warning repointing shifts for ${dupId}:`, repointErr.message);
        }

        // Delete duplicate master employee row
        const { error: delErr } = await supabase
          .from('master_employees')
          .delete()
          .eq('id', dupId);

        if (delErr) {
          console.error(`  Failed to delete duplicate master employee ${dupId}:`, delErr.message);
        } else {
          totalRemoved++;
        }
      }
    }
  }

  const { data: finalEmps } = await supabase.from('master_employees').select('id, name');
  console.log(`\n====================================================`);
  console.log(`  DEDUPLICATION COMPLETE!`);
  console.log(`  Removed ${totalRemoved} duplicate rows.`);
  console.log(`  Final master_employees count: ${finalEmps?.length}`);
  console.log(`====================================================\n`);

  console.log('Current Master Employees:');
  finalEmps?.forEach(e => console.log(`  - [${e.id}] ${e.name}`));
}

deduplicateMasterEmployees().catch(err => console.error(err));
